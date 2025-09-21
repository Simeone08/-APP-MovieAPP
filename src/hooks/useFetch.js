import { useState, useEffect, useRef, useCallback } from "react";

export default function useFetch(fetchFunction, deps = [], params = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  
  // Referência para cancelar requests
  const abortControllerRef = useRef(null);
  const isMountedRef = useRef(true);
  
  // Função de retry com backoff exponencial
  const retry = useCallback((attempt = 0) => {
    const delay = Math.min(1000 * Math.pow(2, attempt), 10000); // Max 10s
    setTimeout(() => {
      if (isMountedRef.current) {
        setRetryCount(attempt + 1);
      }
    }, delay);
  }, []);

  const executeFetch = useCallback(async (isRetry = false) => {
    try {
      // Cancela request anterior se existir
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Cria novo controller
      abortControllerRef.current = new AbortController();
      
      if (!isRetry) {
        setLoading(true);
        setRetryCount(0);
      }
      setError(null);

      // Executa a função com signal para cancelamento
      const result = await fetchFunction({
        ...params,
        signal: abortControllerRef.current.signal
      });
      
      // Só atualiza se o componente ainda estiver montado
      if (isMountedRef.current) {
        setData(result);
        setError(null);
        setRetryCount(0);
      }
    } catch (err) {
      // Ignora erros de cancelamento
      if (err.name === 'AbortError') return;
      
      if (isMountedRef.current) {
        const errorMessage = err.message || "Ocorreu um erro ao carregar os dados 😥";
        setError(errorMessage);
        
        // Auto-retry para erros de rede (máximo 3 tentativas)
        if (retryCount < 3 && (
          err.message?.includes('conexão') || 
          err.message?.includes('Tempo limite') ||
          err.message?.includes('Sem conexão')
        )) {
          retry(retryCount);
        }
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [fetchFunction, params, retryCount, retry]);

  // Função manual de refetch
  const refetch = useCallback(() => {
    executeFetch(false);
  }, [executeFetch]);

  // Effect principal
  useEffect(() => {
    executeFetch(false);
    
    // Cleanup ao desmontar
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, deps);

  // Effect para retry automático
  useEffect(() => {
    if (retryCount > 0 && retryCount <= 3) {
      executeFetch(true);
    }
  }, [retryCount, executeFetch]);

  // Cleanup no unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return { 
    data, 
    loading, 
    error, 
    refetch,
    isRetrying: retryCount > 0 && retryCount <= 3
  };
}

// Hook para debounce
export function useDebounce(value, delay) {
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

// Hook para detectar conexão de rede
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}