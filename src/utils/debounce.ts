/**
 * Debounce and Throttle Utilities
 * Prevents excessive API calls and improves performance
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFunction = (...args: any[]) => any;

/**
 * Debounce function - delays execution until after wait ms have elapsed since last call
 */
export function debounce<T extends AnyFunction>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    return function (this: unknown, ...args: Parameters<T>) {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }

        timeoutId = setTimeout(() => {
            func.apply(this, args);
            timeoutId = null;
        }, wait);
    };
}

/**
 * Throttle function - limits execution to once per wait ms
 */
export function throttle<T extends AnyFunction>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let lastTime = 0;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    return function (this: unknown, ...args: Parameters<T>) {
        const now = Date.now();

        if (now - lastTime >= wait) {
            if (timeoutId) {
                clearTimeout(timeoutId);
                timeoutId = null;
            }
            lastTime = now;
            func.apply(this, args);
        } else if (!timeoutId) {
            timeoutId = setTimeout(() => {
                lastTime = Date.now();
                timeoutId = null;
                func.apply(this, args);
            }, wait - (now - lastTime));
        }
    };
}

/**
 * Creates a debounced async function that returns a promise
 */
export function debounceAsync<T extends AnyFunction>(
    func: T,
    wait: number
): (...args: Parameters<T>) => Promise<Awaited<ReturnType<T>>> {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let pendingResolve: ((value: Awaited<ReturnType<T>>) => void) | null = null;
    let pendingReject: ((reason: unknown) => void) | null = null;

    return function (this: unknown, ...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> {
        return new Promise((resolve, reject) => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }

            pendingResolve = resolve;
            pendingReject = reject;

            timeoutId = setTimeout(async () => {
                try {
                    const result = await func.apply(this, args);
                    if (pendingResolve) {
                        pendingResolve(result as Awaited<ReturnType<T>>);
                    }
                } catch (error) {
                    if (pendingReject) {
                        pendingReject(error);
                    }
                }
                timeoutId = null;
            }, wait);
        });
    };
}

/**
 * Rate limiter - limits calls to maxCalls per windowMs
 */
export function rateLimiter<T extends AnyFunction>(
    func: T,
    maxCalls: number,
    windowMs: number
): (...args: Parameters<T>) => void {
    const calls: number[] = [];

    return function (this: unknown, ...args: Parameters<T>) {
        const now = Date.now();

        // Remove calls outside the window
        while (calls.length > 0 && calls[0] < now - windowMs) {
            calls.shift();
        }

        if (calls.length < maxCalls) {
            calls.push(now);
            func.apply(this, args);
        } else {
            console.warn('Rate limit exceeded, call dropped');
        }
    };
}
