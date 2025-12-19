import { useState, useEffect, useCallback, useRef } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const dataCache = new Map<string, CacheEntry<any>>();
const CACHE_DURATION = 1000 * 60 * 5;

interface UseCachedDataOptions {
  cacheKey: string;
  cacheDuration?: number;
  enabled?: boolean;
}

export function useCachedData<T>(
  fetchFn: () => Promise<T>,
  options: UseCachedDataOptions
) {
  const { cacheKey, cacheDuration = CACHE_DURATION, enabled = true } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const fetchingRef = useRef(false);

  const fetchData = useCallback(async (force = false) => {
    if (fetchingRef.current) return;

    const cached = dataCache.get(cacheKey);
    const now = Date.now();

    if (!force && cached && (now - cached.timestamp) < cacheDuration) {
      setData(cached.data);
      setLoading(false);
      return;
    }

    fetchingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const result = await fetchFn();
      dataCache.set(cacheKey, {
        data: result,
        timestamp: now
      });
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [cacheKey, cacheDuration, fetchFn]);

  useEffect(() => {
    if (enabled) {
      fetchData();
    }
  }, [enabled, fetchData]);

  const refetch = useCallback(() => fetchData(true), [fetchData]);

  return { data, loading, error, refetch };
}

export function clearDataCache(key?: string): void {
  if (key) {
    dataCache.delete(key);
  } else {
    dataCache.clear();
  }
}
