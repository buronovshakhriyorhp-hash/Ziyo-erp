import { useState, useCallback } from "react";
import { getApiError } from "@/services/api";

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * Generic API so'rov holati boshqaruvchi hook.
 *
 * @example
 * const { data, loading, error, execute } = useApi<Lead[]>()
 * useEffect(() => { execute(() => crmService.getLeads()) }, [])
 */
export function useApi<T>() {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(async (fn: () => Promise<T>) => {
    setState({ data: null, loading: true, error: null });
    try {
      const data = await fn();
      setState({ data, loading: false, error: null });
      return data;
    } catch (_err) {
      const error = getApiError(_err);
      setState((s) => ({ ...s, loading: false, error }));
      throw _err;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return { ...state, execute, reset };
}
