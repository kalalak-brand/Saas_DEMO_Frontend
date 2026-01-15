// src/hooks/useApiCall.ts
import { useState, useCallback, useRef, useEffect } from 'react';
import axios, { AxiosRequestConfig, AxiosError, CancelTokenSource } from 'axios';
import { useAuthStore } from '../stores/authStore';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Cache storage for API responses
 */
interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

/**
 * Request deduplication - track in-flight requests
 */
const inFlightRequests = new Map<string, Promise<unknown>>();

/**
 * Configuration for useApiCall hook
 */
interface UseApiCallConfig {
    /** API endpoint path (without base URL) */
    url: string;
    /** HTTP method */
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    /** Request body data */
    data?: unknown;
    /** Cache key for GET requests (defaults to URL) */
    cacheKey?: string;
    /** Cache TTL in milliseconds (default: 30000 = 30 seconds) */
    cacheTTL?: number;
    /** Enable request deduplication (default: true for GET) */
    dedupe?: boolean;
    /** Number of retry attempts (default: 3) */
    retries?: number;
    /** Skip authentication header */
    skipAuth?: boolean;
    /** Initial fetch on mount (for GET requests) */
    immediate?: boolean;
}

/**
 * Result of useApiCall hook
 */
interface UseApiCallResult<T> {
    data: T | null;
    isLoading: boolean;
    error: string | null;
    statusCode: number | null;
    execute: (overrideData?: unknown) => Promise<T | null>;
    reset: () => void;
    clearCache: () => void;
}

/**
 * Calculate exponential backoff delay
 */
const getBackoffDelay = (attempt: number, baseDelay = 1000): number => {
    return Math.min(baseDelay * Math.pow(2, attempt), 10000);
};

/**
 * Check if error is a rate limit (429) error
 */
const isRateLimitError = (error: AxiosError): boolean => {
    return error.response?.status === 429;
};

/**
 * Optimized API hook with caching, deduplication, and retry logic
 * 
 * Features:
 * - Request deduplication (prevents duplicate in-flight requests)
 * - Response caching with configurable TTL
 * - Exponential backoff retry on failure
 * - Rate limit (429) handling with automatic delay
 * - Request cancellation on unmount
 * - Automatic auth header injection
 */
export function useApiCall<T = unknown>(config: UseApiCallConfig): UseApiCallResult<T> {
    const {
        url,
        method = 'GET',
        data: requestData,
        cacheKey,
        cacheTTL = 30000,
        dedupe = method === 'GET',
        retries = 3,
        skipAuth = false,
        immediate = false,
    } = config;

    const [data, setData] = useState<T | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [statusCode, setStatusCode] = useState<number | null>(null);

    const cancelTokenRef = useRef<CancelTokenSource | null>(null);
    const mountedRef = useRef(true);

    // Get the cache key for this request
    const getCacheKey = useCallback(() => {
        return cacheKey || `${method}:${url}`;
    }, [method, url, cacheKey]);

    // Check if cached data is still valid
    const getCachedData = useCallback((): T | null => {
        const key = getCacheKey();
        const entry = cache.get(key) as CacheEntry<T> | undefined;

        if (entry && Date.now() - entry.timestamp < cacheTTL) {
            return entry.data;
        }

        // Remove expired entry
        if (entry) {
            cache.delete(key);
        }

        return null;
    }, [getCacheKey, cacheTTL]);

    // Set cached data
    const setCachedData = useCallback((responseData: T) => {
        const key = getCacheKey();
        cache.set(key, {
            data: responseData,
            timestamp: Date.now(),
        });
    }, [getCacheKey]);

    // Clear cache for this request
    const clearCache = useCallback(() => {
        const key = getCacheKey();
        cache.delete(key);
    }, [getCacheKey]);

    // Reset state
    const reset = useCallback(() => {
        setData(null);
        setError(null);
        setStatusCode(null);
        setIsLoading(false);
    }, []);

    // Execute the API call
    const execute = useCallback(
        async (overrideData?: unknown): Promise<T | null> => {
            const token = useAuthStore.getState().token;
            const key = getCacheKey();

            // Check cache first for GET requests
            if (method === 'GET') {
                const cached = getCachedData();
                if (cached) {
                    setData(cached);
                    return cached;
                }
            }

            // Check for in-flight request (deduplication)
            if (dedupe && inFlightRequests.has(key)) {
                try {
                    const result = await inFlightRequests.get(key) as T;
                    if (mountedRef.current) {
                        setData(result);
                    }
                    return result;
                } catch {
                    // Let it proceed to make a new request
                }
            }

            // Cancel any pending request
            if (cancelTokenRef.current) {
                cancelTokenRef.current.cancel('New request initiated');
            }
            cancelTokenRef.current = axios.CancelToken.source();

            setIsLoading(true);
            setError(null);

            const axiosConfig: AxiosRequestConfig = {
                url: `${BASE_URL}${url}`,
                method,
                data: overrideData ?? requestData,
                cancelToken: cancelTokenRef.current.token,
                headers: {},
            };

            if (!skipAuth && token) {
                axiosConfig.headers = {
                    ...axiosConfig.headers,
                    Authorization: `Bearer ${token}`,
                };
            }

            const executeRequest = async (attempt = 0): Promise<T> => {
                try {
                    const response = await axios(axiosConfig);

                    if (mountedRef.current) {
                        setStatusCode(response.status);
                    }

                    return response.data;
                } catch (err) {
                    const axiosError = err as AxiosError;

                    // Don't retry cancelled requests
                    if (axios.isCancel(err)) {
                        throw err;
                    }

                    // Handle rate limiting (429)
                    if (isRateLimitError(axiosError) && attempt < retries) {
                        const retryAfter = parseInt(
                            axiosError.response?.headers?.['retry-after'] || '0',
                            10
                        );
                        const delay = retryAfter * 1000 || getBackoffDelay(attempt);

                        console.warn(`Rate limited. Retrying in ${delay}ms...`);
                        await new Promise((resolve) => setTimeout(resolve, delay));
                        return executeRequest(attempt + 1);
                    }

                    // Retry on server errors (5xx) with exponential backoff
                    if (
                        axiosError.response?.status &&
                        axiosError.response.status >= 500 &&
                        attempt < retries
                    ) {
                        const delay = getBackoffDelay(attempt);
                        console.warn(`Server error. Retrying in ${delay}ms...`);
                        await new Promise((resolve) => setTimeout(resolve, delay));
                        return executeRequest(attempt + 1);
                    }

                    throw axiosError;
                }
            };

            // Create the request promise
            const requestPromise = executeRequest();

            // Track in-flight request for deduplication
            if (dedupe) {
                inFlightRequests.set(key, requestPromise);
            }

            try {
                const result = await requestPromise;

                if (mountedRef.current) {
                    setData(result);
                    setIsLoading(false);
                }

                // Cache GET responses
                if (method === 'GET') {
                    setCachedData(result);
                }

                return result;
            } catch (err) {
                if (axios.isCancel(err)) {
                    return null;
                }

                const axiosError = err as AxiosError<{ message?: string }>;

                if (mountedRef.current) {
                    setStatusCode(axiosError.response?.status || null);
                    setError(
                        axiosError.response?.data?.message ||
                        axiosError.message ||
                        'An error occurred'
                    );
                    setIsLoading(false);
                }

                return null;
            } finally {
                // Remove from in-flight tracking
                if (dedupe) {
                    inFlightRequests.delete(key);
                }
            }
        },
        [
            method,
            url,
            requestData,
            getCacheKey,
            getCachedData,
            setCachedData,
            dedupe,
            retries,
            skipAuth,
        ]
    );

    // Cleanup on unmount
    useEffect(() => {
        mountedRef.current = true;

        // Execute immediately if configured
        if (immediate && method === 'GET') {
            execute();
        }

        return () => {
            mountedRef.current = false;
            if (cancelTokenRef.current) {
                cancelTokenRef.current.cancel('Component unmounted');
            }
        };
    }, [immediate, method]); // eslint-disable-line react-hooks/exhaustive-deps

    return {
        data,
        isLoading,
        error,
        statusCode,
        execute,
        reset,
        clearCache,
    };
}

/**
 * Clear all cached API responses
 */
export const clearAllCache = (): void => {
    cache.clear();
};

/**
 * Clear cache entries matching a pattern
 */
export const clearCacheByPattern = (pattern: string | RegExp): void => {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;

    for (const key of cache.keys()) {
        if (regex.test(key)) {
            cache.delete(key);
        }
    }
};

export default useApiCall;
