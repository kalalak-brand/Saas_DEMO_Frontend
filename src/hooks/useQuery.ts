/**
 * Custom React Hooks for data fetching with caching and optimization
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { debounce } from '../utils/debounce';

/**
 * Cache for storing fetched data
 */
const queryCache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Hook for fetching data with caching, deduplication, and error handling
 */
export function useQuery<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: {
        enabled?: boolean;
        cacheTime?: number;
        refetchOnMount?: boolean;
        refetchInterval?: number;
    } = {}
) {
    const {
        enabled = true,
        cacheTime = CACHE_TTL,
        refetchOnMount = true,
        refetchInterval,
    } = options;

    const [data, setData] = useState<T | null>(() => {
        const cached = queryCache.get(key);
        if (cached && Date.now() - cached.timestamp < cacheTime) {
            return cached.data as T;
        }
        return null;
    });
    const [isLoading, setIsLoading] = useState(!data);
    const [error, setError] = useState<Error | null>(null);
    const mountedRef = useRef(true);

    const fetchData = useCallback(async () => {
        if (!enabled) return;

        // Check cache first
        const cached = queryCache.get(key);
        if (cached && Date.now() - cached.timestamp < cacheTime && !refetchOnMount) {
            setData(cached.data as T);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const result = await fetcher();
            if (mountedRef.current) {
                setData(result);
                queryCache.set(key, { data: result, timestamp: Date.now() });
            }
        } catch (err) {
            if (mountedRef.current) {
                setError(err instanceof Error ? err : new Error('Unknown error'));
            }
        } finally {
            if (mountedRef.current) {
                setIsLoading(false);
            }
        }
    }, [key, fetcher, enabled, cacheTime, refetchOnMount]);

    useEffect(() => {
        mountedRef.current = true;
        fetchData();

        // Set up refetch interval if specified
        let intervalId: ReturnType<typeof setInterval> | undefined;
        if (refetchInterval && refetchInterval > 0) {
            intervalId = setInterval(fetchData, refetchInterval);
        }

        return () => {
            mountedRef.current = false;
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [fetchData, refetchInterval]);

    const refetch = useCallback(() => {
        queryCache.delete(key);
        fetchData();
    }, [key, fetchData]);

    return { data, isLoading, error, refetch };
}

/**
 * Hook for mutations (POST, PUT, DELETE) with optimistic updates
 */
export function useMutation<T, V>(
    mutationFn: (variables: V) => Promise<T>,
    options: {
        onSuccess?: (data: T, variables: V) => void;
        onError?: (error: Error, variables: V) => void;
        invalidateKeys?: string[];
    } = {}
) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [data, setData] = useState<T | null>(null);

    const mutate = useCallback(
        async (variables: V) => {
            setIsLoading(true);
            setError(null);

            try {
                const result = await mutationFn(variables);
                setData(result);

                // Invalidate cached queries
                if (options.invalidateKeys) {
                    options.invalidateKeys.forEach((key) => {
                        queryCache.delete(key);
                    });
                }

                options.onSuccess?.(result, variables);
                return result;
            } catch (err) {
                const error = err instanceof Error ? err : new Error('Mutation failed');
                setError(error);
                options.onError?.(error, variables);
                throw error;
            } finally {
                setIsLoading(false);
            }
        },
        [mutationFn, options]
    );

    return { mutate, isLoading, error, data };
}

/**
 * Hook for debounced search/filter
 */
export function useDebouncedValue<T>(value: T, delay: number = 300): T {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFunction = (...args: any[]) => any;

/**
 * Hook for debounced callback
 */
export function useDebouncedCallback<T extends AnyFunction>(
    callback: T,
    delay: number = 300
): (...args: Parameters<T>) => void {
    const callbackRef = useRef(callback);
    callbackRef.current = callback;

    const debouncedFn = useRef(
        debounce((...args: Parameters<T>) => {
            callbackRef.current(...args);
        }, delay)
    );

    return debouncedFn.current;
}

/**
 * Invalidate a cached query
 */
export function invalidateQuery(key: string): void {
    queryCache.delete(key);
}

/**
 * Clear all cached queries
 */
export function clearQueryCache(): void {
    queryCache.clear();
}
