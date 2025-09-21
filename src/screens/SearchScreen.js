import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  TextInput,
  FlatList,
  Text,
  StyleSheet,
  Pressable,
  Keyboard,
  SafeAreaView,
} from "react-native";
import { searchMovies } from "../api/tmdb";
import { useDebounce } from "../hooks/useFetch";
import MovieCard from "../components/MovieCard";
import { LoadingSpinner, ErrorMessage, EmptyState, NetworkStatus } from "../components/UtilitiesComponents";

export default function SearchScreen() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);

  // Debounce da query para evitar muitas requisições
  const debouncedQuery = useDebounce(query, 500);

  // Função de busca
  const performSearch = useCallback(async (searchQuery) => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setResults([]);
      setError(null);
      setHasSearched(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setHasSearched(true);

      const data = await searchMovies(searchQuery.trim());
      setResults(data || []);

      // Adiciona à lista de buscas recentes (máximo 5)
      setRecentSearches(prev => {
        const newSearches = [searchQuery.trim(), ...prev.filter(s => s !== searchQuery.trim())];
        return newSearches.slice(0, 5);
      });
      
    } catch (err) {
      setError(err.message || "Erro ao buscar filmes");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Busca automática quando a query muda (debounced)
  useEffect(() => {
    if (debouncedQuery !== query) return; // Evita busca durante digitação rápida
    performSearch(debouncedQuery);
  }, [debouncedQuery, performSearch]);

  // Função para busca manual (botão)
  const handleManualSearch = useCallback(() => {
    Keyboard.dismiss();
    performSearch(query);
  }, [query, performSearch]);

  // Função para usar busca recente
  const useRecentSearch = useCallback((recentQuery) => {
    setQuery(recentQuery);
  }, []);

  // Limpar busca
  const clearSearch = useCallback(() => {
    setQuery("");
    setResults([]);
    setError(null);
    setHasSearched(false);
  }, []);

  // Callback quando status do filme muda
  const handleMovieStatusChange = useCallback((movieId, newStatus, previousStatus) => {
    console.log(`Filme ${movieId} mudou de ${previousStatus} para ${newStatus}`);
  }, []);

  // Renderizador de filme
  const renderMovie = useCallback(({ item }) => (
    <MovieCard 
      key={item.id} 
      movie={item} 
      onStatusChange={handleMovieStatusChange}
    />
  ), [handleMovieStatusChange]);

  // Renderizador de busca recente
  const renderRecentSearch = useCallback(({ item }) => (
    <Pressable 
      style={styles.recentItem}
      onPress={() => useRecentSearch(item)}
    >
      <Text style={styles.recentText}>🔍 {item}</Text>
    </Pressable>
  ), [useRecentSearch]);

  return (
    <SafeAreaView style={styles.container}>
      <NetworkStatus />
      
      {/* Barra de busca */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <TextInput
            placeholder="Buscar filme... (min. 2 caracteres)"
            value={query}
            onChangeText={setQuery}
            style={styles.searchInput}
            onSubmitEditing={handleManualSearch}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
            clearButtonMode="while-editing"
          />
          
          {query.length > 0 && (
            <Pressable 
              style={styles.clearButton}
              onPress={clearSearch}
            >
              <Text style={styles.clearButtonText}>✕</Text>
            </Pressable>
          )}
        </View>

        {/* Botão de busca manual */}
        <Pressable 
          style={[
            styles.searchButton, 
            query.trim().length < 2 && styles.searchButtonDisabled
          ]}
          onPress={handleManualSearch}
          disabled={query.trim().length < 2}
        >
          <Text style={[
            styles.searchButtonText,
            query.trim().length < 2 && styles.searchButtonTextDisabled
          ]}>
            Buscar
          </Text>
        </Pressable>
      </View>

      {/* Indicador de carregamento inline */}
      {loading && (
        <View style={styles.inlineLoader}>
          <Text style={styles.loadingText}>🔍 Buscando...</Text>
        </View>
      )}

      {/* Conteúdo principal */}
      {!hasSearched && recentSearches.length > 0 && (
        <View style={styles.recentContainer}>
          <Text style={styles.recentTitle}>Buscas recentes:</Text>
          <FlatList
            data={recentSearches}
            keyExtractor={(item, index) => `recent-${index}`}
            renderItem={renderRecentSearch}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recentList}
          />
        </View>
      )}

      {/* Estados de conteúdo */}
      {error && (
        <ErrorMessage 
          message={error}
          onRetry={() => performSearch(query)}
          retryText="Tentar novamente"
        />
      )}

      {!loading && !error && hasSearched && results.length === 0 && (
        <EmptyState
          emoji="🎬"
          title="Nenhum filme encontrado"
          subtitle={`Não encontramos resultados para "${query}". Tente outros termos de busca.`}
          actionText="Nova busca"
          onAction={clearSearch}
        />
      )}

      {!loading && !error && hasSearched && results.length > 0 && (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsCount}>
            {results.length} filme{results.length !== 1 ? 's' : ''} encontrado{results.length !== 1 ? 's' : ''}
          </Text>
          
          <FlatList
            data={results}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderMovie}
            numColumns={2}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            
            // Otimizações
            removeClippedSubviews={true}
            maxToRenderPerBatch={6}
            initialNumToRender={6}
            windowSize={10}
            
            // Acessibilidade
            accessible={true}
            accessibilityLabel={`Resultados da busca por ${query}`}
          />
        </View>
      )}

      {/* Estado inicial - sem busca */}
      {!hasSearched && recentSearches.length === 0 && (
        <EmptyState
          emoji="🔍"
          title="Buscar filmes"
          subtitle="Digite o nome de um filme para começar a busca"
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  searchContainer: {
    backgroundColor: '#fff',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    minHeight: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 12,
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  clearButtonText: {
    fontSize: 18,
    color: '#999',
  },
  searchButton: {
    backgroundColor: '#E50914',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    minHeight: 44,
    justifyContent: 'center',
  },
  searchButtonDisabled: {
    backgroundColor: '#ccc',
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  searchButtonTextDisabled: {
    color: '#999',
  },
  inlineLoader: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  recentContainer: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  recentTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  recentList: {
    paddingRight: 16,
  },
  recentItem: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  recentText: {
    fontSize: 14,
    color: '#666',
  },
  resultsContainer: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  resultsCount: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  list: {
    padding: 10,
    paddingBottom: 20,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 10,
  },
});