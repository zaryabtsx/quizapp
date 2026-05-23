import { useState, useEffect } from "react";

interface UseAsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export function useAsync<T>(
  asyncFn: () => Promise<T>,
  deps?: any[],
  immediate = true
): UseAsyncState<T> & { execute: () => Promise<void>; refetch: () => Promise<void> } {
  const [state, setState] = useState<UseAsyncState<T>>({
    data: null,
    loading: immediate ? true : false,
    error: null,
  });

  const execute = async () => {
    setState({ data: null, loading: true, error: null });
    try {
      const response = await asyncFn();
      setState({ data: response, loading: false, error: null });
    } catch (error) {
      setState({
        data: null,
        loading: false,
        error: error instanceof Error ? error : new Error(String(error)),
      });
    }
  };

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, deps || []);

  return { ...state, execute, refetch: execute };
}
