// components/LoadingSpinner.js
import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

export const LoadingSpinner = ({ message = "Carregando...", size = "large", color = "#E50914" }) => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size={size} color={color} />
    <Text style={styles.loadingText}>{message}</Text>
  </View>
);

// components/ErrorMessage.js
export const ErrorMessage = ({ message, onRetry, retryText = "Tentar novamente" }) => (
  <View style={styles.errorContainer}>
    <Text style={styles.errorEmoji}>😕</Text>
    <Text style={styles.errorText}>{message}</Text>
    {onRetry && (
      <Pressable style={styles.retryButton} onPress={onRetry}>
        <Text style={styles.retryButtonText}>{retryText}</Text>
      </Pressable>
    )}
  </View>
);

// components/EmptyState.js
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
      <Pressable style={styles.emptyAction} onPress={onAction}>
        <Text style={styles.emptyActionText}>{actionText}</Text>
      </Pressable>
    )}
  </View>
);

// components/NetworkStatus.js
import { useNetworkStatus } from '../hooks/useFetch';

export const NetworkStatus = () => {
  const isOnline = useNetworkStatus();
  
  if (isOnline) return null;
  
  return (
    <View style={styles.networkBanner}>
      <Text style={styles.networkText}>📡 Sem conexão com a internet</Text>
    </View>
  );
};

// components/RetryBanner.js
export const RetryBanner = ({ isRetrying, attempt, maxAttempts = 3 }) => {
  if (!isRetrying) return null;
  
  return (
    <View style={styles.retryBanner}>
      <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
      <Text style={styles.retryText}>
        Tentativa {attempt} de {maxAttempts}...
      </Text>
    </View>
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
});