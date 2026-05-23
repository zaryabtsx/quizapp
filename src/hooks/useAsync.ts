// src/hooks/useAsync.ts
// Generic hook for async data loading with loading/error states

import { useState, useEffect, useCallback, useRef } from "react";

export function useAsync<T>(
  fn: () => Promise<T>,
  deps: unknown[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fn();
      if (mountedRef.current) setData(result);
    } catch (err) {
      if (mountedRef.current)
        setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    mountedRef.current = true;
    run();
    return () => {
      mountedRef.current = false;
    };
  }, [run]);

  return { data, loading, error, refetch: run };
}