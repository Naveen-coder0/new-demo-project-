import { useState, useEffect, useCallback, useRef } from "react";

type Options<T> = {
  /** Async function that fetches the data. */
  fetcher: () => Promise<T>;
  /** Polling interval in ms. Default 10000 (10s). */
  interval?: number;
  /** Whether to start polling. Default true. */
  enabled?: boolean;
};

/**
 * Real-time polling hook.
 * Fetches data at a set interval and re-renders on changes.
 * Auto-reconnects and handles errors silently.
 */
export function useRealtime<T>(options: Options<T>) {
  const { fetcher, interval = 10000, enabled = true } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const load = useCallback(async () => {
    try {
      const result = await fetcher();
      if (mountedRef.current) {
        setData(result);
        setError(null);
      }
    } catch (e: any) {
      if (mountedRef.current) setError(e.message || "Fetch failed");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [fetcher]);

  useEffect(() => {
    mountedRef.current = true;
    if (!enabled) return;

    load(); // initial fetch
    const timer = setInterval(load, interval);

    return () => {
      mountedRef.current = false;
      clearInterval(timer);
    };
  }, [load, interval, enabled]);

  const refresh = useCallback(() => { load(); }, [load]);

  return { data, loading, error, refresh };
}

/**
 * Hook specifically for polling order status (customer tracking).
 * Returns the latest order status and auto-updates every 8 seconds.
 */
export function useOrderTracking(orderId: string | null, fetcher: (id: string) => Promise<any>) {
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;
    let alive = true;

    const poll = async () => {
      try {
        const result = await fetcher(orderId);
        if (alive) setStatus(result?.status ?? null);
      } catch {}
    };

    poll();
    const timer = setInterval(poll, 8000);
    return () => { alive = false; clearInterval(timer); };
  }, [orderId, fetcher]);

  return status;
}
