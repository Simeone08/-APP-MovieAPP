import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';

export const LoadingSpinner = ({ message = "Carregando...", size = "large", color = "#E50914" }) => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size={size} color={color} />
    <Text style={styles.loadingText}>{message}</Text>
  </View>
);

export const ErrorMessage = ({ message, onRetry, retryText = "Tentar novamente" }) => (
  <View style={styles.errorContainer}>
    <Text style={styles.errorEmoji}>😕</Text>
    <Text style={styles.errorText}>{message}</Text>
    {onRetry && (
      <TouchableOpacity style={styles.retryButton} onPress={onRetry} activeOpacity={0.8}>
        <Text style={styles.retryButtonText}>{retryText}</Text>
      </TouchableOpacity>
    )}
  </View>
);

export const EmptyState = ({ 
  emoji = "🎬", 
  title = "Nenhum filme encontrado", 
  subtitle = null,
  actionText = null,
  onAction = null 
}) => (
  <View style={styles.emptyContainer}>
    <Text style={styles.emptyEmoji}>{emoji}</Text>
    <Text style={styles.emptyTitle}>{title}</Text>
    {subtitle && <Text style={styles.emptySubtitle}>{subtitle}</Text>}
    {actionText && onAction && (
      <TouchableOpacity style={styles.emptyAction} onPress={onAction} activeOpacity={0.8}>
        <Text style={styles.emptyActionText}>{actionText}</Text>
      </TouchableOpacity>
    )}
  </View>
);

// NetworkStatus simplificado - sem hooks complexos
export const NetworkStatus = ({ isOffline = false }) => {
  if (!isOffline) return null;
  
  return (
    <View style={styles.networkBanner}>
      <Text style={styles.networkText}>📡 Verifique sua conexão</Text>
    </View>
  );
};

// RetryBanner simplificado
export const RetryBanner = ({ isRetrying, attempt, maxAttempts = 3 }) => {
  if (!isRetrying) return null;
  
  return (
    <View style={styles.retryBanner}>
      <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
      <Text style={styles.retryText}>
        Tentando novamente...
      </Text>
    </View>
  );
};

// Componente de status de conexão simples
export const SimpleNetworkStatus = ({ 
  children, 
  showOfflineMessage = true,
  offlineComponent = null 
}) => {
  // Por simplicidade, assume online. Em produção, você pode usar NetInfo
  const [isOnline, setIsOnline] = React.useState(true);
  
  // Simulação simples de teste de conectividade
  React.useEffect(() => {
    const testConnection = async () => {
      try {
        const response = await fetch('https://httpbin.org/status/200', {
          method: 'HEAD',
          cache: 'no-cache',
        });
        setIsOnline(response.ok);
      } catch {
        setIsOnline(false);
      }
    };
    
    // Testa conectividade a cada 30 segundos
    const interval = setInterval(testConnection, 30000);
    testConnection(); // Teste inicial
    
    return () => clearInterval(interval);
  }, []);
  
  if (!isOnline) {
    if (offlineComponent) return offlineComponent;
    if (showOfflineMessage) {
      return (
        <View style={styles.offlineContainer}>
          <NetworkStatus isOffline={true} />
          <EmptyState
            emoji="📡"
            title="Sem conexão"
            subtitle="Verifique sua conexão com a internet e tente novamente"
          />
        </View>
      );
    }
  }
  
  return (
    <>
      <NetworkStatus isOffline={!isOnline} />
      {children}
    </>
  );
};

const styles = StyleSheet.create({
  // Loading Spinner
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },

  // Error Message
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: '#E50914',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  emptyAction: {
    backgroundColor: '#E50914',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  emptyActionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },

  // Network Status
  networkBanner: {
    backgroundColor: '#ff6b35',
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  networkText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },

  // Retry Banner
  retryBanner: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryText: {
    color: '#fff',
    fontSize: 14,
  },

  // Offline Container
  offlineContainer: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
});