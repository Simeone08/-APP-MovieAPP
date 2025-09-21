import { useState, useEffect, useRef, useCallback } from "react";

// Hook principal para fetch de dados
export default function useFetch(fetchFunction, deps = [], params = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  
  // Referências para controle de lifecycle
  const cancelledRef = useRef(false);
  const isMountedRef = useRef(true);
  
  // Função de retry com backoff exponencial
  const retry = useCallback((attempt = 0) => {
    const delay = Math.min(1000 * Math.pow(2, attempt), 10000); // Máximo 10 segundos
    setTimeout(() => {
      if (isMountedRef.current && !cancelledRef.current) {
        setRetryCount(attempt + 1);
      }
    }, delay);
  }, []);

  // Função principal de execução do fetch
  const executeFetch = useCallback(async (isRetry = false) => {
    try {
      // Reset do cancelamento
      cancelledRef.current = false;
      
      if (!isRetry) {
        setLoading(true);
        setRetryCount(0);
      }
      setError(null);

      // Executa a função de fetch
      const result = await fetchFunction(params);
      
      // Só atualiza estado se componente ainda estiver montado
      if (isMountedRef.current && !cancelledRef.current) {
        setData(result);
        setError(null);
        setRetryCount(0);
      }
    } catch (err) {
      if (isMountedRef.current && !cancelledRef.current) {
        const errorMessage = err.message || "Ocorreu um erro ao carregar os dados 😥";
        setError(errorMessage);
        
        // Auto-retry para erros de conectividade (máximo 3 tentativas)
        const isNetworkError = err.message?.includes('conexão') || 
                              err.message?.includes('Tempo limite') ||
                              err.message?.includes('Sem conexão') ||
                              err.message?.includes('Network') ||
                              err.message?.includes('fetch');
        
        if (retryCount < 3 && isNetworkError) {
          retry(retryCount);
        }
      }
    } finally {
      if (isMountedRef.current && !cancelledRef.current) {
        setLoading(false);
      }
    }
  }, [fetchFunction, params, retryCount, retry]);

  // Função para refetch manual
  const refetch = useCallback(() => {
    cancelledRef.current = false;
    executeFetch(false);
  }, [executeFetch]);

  // Effect principal - executa fetch quando deps mudam
  useEffect(() => {
    executeFetch(false);
    
    return () => {
      cancelledRef.current = true;
    };
  }, deps);

  // Effect para retry automático
  useEffect(() => {
    if (retryCount > 0 && retryCount <= 3) {
      executeFetch(true);
    }
  }, [retryCount, executeFetch]);

  // Cleanup quando componente desmonta
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      cancelledRef.current = true;
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

// Hook para debounce - evita muitas chamadas consecutivas
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

// Hook simples para status de rede (sem dependências externas)
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [lastCheck, setLastCheck] = useState(Date.now());

  // Função para testar conectividade
  const checkConnection = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch('https://httpbin.org/status/200', {
        method: 'HEAD',
        cache: 'no-cache',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      const online = response.ok;
      setIsOnline(online);
      setLastCheck(Date.now());
      return online;
    } catch (error) {
      setIsOnline(false);
      setLastCheck(Date.now());
      return false;
    }
  }, []);

  useEffect(() => {
    // Verifica conectividade a cada 30 segundos
    const interval = setInterval(checkConnection, 30000);
    
    // Verifica imediatamente
    checkConnection();

    return () => clearInterval(interval);
  }, [checkConnection]);

  return { isOnline, lastCheck, checkConnection };
}

// Hook para gerenciar previous value
export function usePrevious(value) {
  const ref = useRef();
  
  useEffect(() => {
    ref.current = value;
  });
  
  return ref.current;
}

// Hook para mounted state
export function useIsMounted() {
  const isMountedRef = useRef(true);
  
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  return useCallback(() => isMountedRef.current, []);
}