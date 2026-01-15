/**
 * API Client with request deduplication, retry logic, and rate limiting protection
 */
import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import { useAuthStore } from '../stores/authStore';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Request cache to prevent duplicate requests
 */
const pendingRequests = new Map<string, Promise<unknown>>();

/**
 * Generate a cache key for a request
 */
const getCacheKey = (config: AxiosRequestConfig): string => {
    return `${config.method}-${config.url}-${JSON.stringify(config.params || {})}`;
};

/**
 * Create configured axios instance
 */
const createApiClient = (): AxiosInstance => {
    const client = axios.create({
        baseURL: BASE_URL,
        timeout: 30000,
        headers: {
            'Content-Type': 'application/json',
        },
    });

    // Request interceptor - add auth token
    client.interceptors.request.use(
        (config) => {
            const token = useAuthStore.getState().token;
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        },
        (error) => Promise.reject(error)
    );

    // Response interceptor - handle errors
    client.interceptors.response.use(
        (response) => response,
        async (error: AxiosError) => {
            const originalRequest = error.config;

            // Handle 401 - unauthorized
            if (error.response?.status === 401) {
                useAuthStore.getState().logout();
                window.location.href = '/login';
                return Promise.reject(error);
            }

            // Handle 429 - rate limited
            if (error.response?.status === 429) {
                const retryAfter = error.response.headers['retry-after'];
                const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 5000;

                console.warn(`Rate limited. Retrying after ${waitTime}ms`);

                await new Promise((resolve) => setTimeout(resolve, waitTime));

                if (originalRequest) {
                    return client.request(originalRequest);
                }
            }

            return Promise.reject(error);
        }
    );

    return client;
};

export const apiClient = createApiClient();

/**
 * Deduplicated GET request - prevents duplicate simultaneous requests
 */
export const deduplicatedGet = async <T>(
    url: string,
    config?: AxiosRequestConfig
): Promise<T> => {
    const cacheKey = getCacheKey({ method: 'GET', url, ...config });

    // Check if request is already pending
    const pending = pendingRequests.get(cacheKey);
    if (pending) {
        return pending as Promise<T>;
    }

    // Make the request and cache it
    const request = apiClient.get<T>(url, config).then((res) => {
        pendingRequests.delete(cacheKey);
        return res.data;
    }).catch((error) => {
        pendingRequests.delete(cacheKey);
        throw error;
    });

    pendingRequests.set(cacheKey, request);
    return request;
};

/**
 * API response types
 */
export interface ApiResponse<T> {
    status: 'success' | 'error';
    data?: T;
    message?: string;
    meta?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export default apiClient;
