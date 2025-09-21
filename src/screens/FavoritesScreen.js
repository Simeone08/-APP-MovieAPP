import React, { useEffect, useState, useCallback, useMemo } from "react";
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  RefreshControl,
  SafeAreaView,
  Pressable,
  Dimensions 
} from "react-native";
import { getWatchedMovies, getWantToWatchMovies } from "../storage/movieStorage";
import MovieCard from "../components/MovieCard";
//import { LoadingSpinner, EmptyState } from "../components/UtilityComponents";

const { width } = Dimensions.get('window');

export default function FavoritesScreen() {
  const [watched, setWatched] = useState([]);
  const [wantToWatch, setWantToWatch] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('watched'); // 'watched' | 'wantToWatch'

  // Função para carregar filmes
  const loadMovies = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [watchedMovies, wantMovies] = await Promise.all([
        getWatchedMovies(),
        getWantToWatchMovies()
      ]);

      setWatched(watchedMovies);
      setWantToWatch(wantMovies);
    } catch (error) {
      console.error('Erro ao carregar favoritos:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Carrega filmes na montagem
  useEffect(() => {
    loadMovies();
  }, [loadMovies]);

  // Função de refresh
  const handleRefresh = useCallback(() => {
    loadMovies(true);
  }, [loadMovies]);

  // Callback quando status do filme muda
  const handleMovieStatusChange = useCallback((movieId, newStatus, previousStatus) => {
    // Atualiza as listas localmente para feedback imediato
    if (newStatus === 'watched') {
      // Remove de "quero assistir" e adiciona a "assistidos"
      setWantToWatch(prev => prev.filter(movie => movie.id !== movieId));
      
      // Se o filme não está na lista de assistidos, busca e adiciona
      setWatched(prev => {
        const exists = prev.some(movie => movie.id === movieId);
        if (!exists) {
          loadMovies(); // Recarrega para pegar dados completos
        }
        return prev;
      });
    } else if (newStatus === 'wantToWatch') {
      // Remove de "assistidos" e adiciona a "quero assistir"
      setWatched(prev => prev.filter(movie => movie.id !== movieId));
      
      // Se o filme não está na lista de "quero assistir", busca e adiciona
      setWantToWatch(prev => {
        const exists = prev.some(movie => movie.id === movieId);
        if (!exists) {
          loadMovies(); // Recarrega para pegar dados completos
        }
        return prev;
      });
    }
  }, [loadMovies]);

  // Dados da aba ativa
  const activeData = useMemo(() => {
    return activeTab === 'watched' ? watched : wantToWatch;
  }, [activeTab, watched, wantToWatch]);

  // Estatísticas
  const stats = useMemo(() => ({
    watchedCount: watched.length,
    wantToWatchCount: wantToWatch.length,
    totalCount: watched.length + wantToWatch.length
  }), [watched.length, wantToWatch.length]);

  // Renderizador de filme para lista horizontal
  const renderMovieHorizontal = useCallback(({ item }) => (
    <View style={styles.horizontalMovieContainer}>
      <MovieCard 
        movie={item} 
        onStatusChange={handleMovieStatusChange}
      />
    </View>
  ), [handleMovieStatusChange]);

  // Renderizador de filme para grade
  const renderMovieGrid = useCallback(({ item }) => (
    <MovieCard 
      movie={item} 
      onStatusChange={handleMovieStatusChange}
    />
  ), [handleMovieStatusChange]);

  // Componente de abas
  const TabButton = ({ id, title, count, isActive, onPress }) => (
    <Pressable
      style={[styles.tabButton, isActive && styles.tabButtonActive]}
      onPress={() => onPress(id)}
    >
      <Text style={[styles.tabButtonText, isActive && styles.tabButtonTextActive]}>
        {title}
      </Text>
      <View style={[styles.badge, isActive && styles.badgeActive]}>
        <Text style={[styles.badgeText, isActive && styles.badgeTextActive]}>
          {count}
        </Text>
      </View>
    </Pressable>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header com estatísticas */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Meus Filmes</Text>
        <Text style={styles.headerSubtitle}>
          {stats.totalCount} filme{stats.totalCount !== 1 ? 's' : ''} no total
        </Text>
      </View>

      {/* Abas */}
      <View style={styles.tabContainer}>
        <TabButton
          id="watched"
          title="Já assisti"
          count={stats.watchedCount}
          isActive={activeTab === 'watched'}
          onPress={setActiveTab}
        />
        <TabButton
          id="wantToWatch"
          title="Quero assistir"
          count={stats.wantToWatchCount}
          isActive={activeTab === 'wantToWatch'}
          onPress={setActiveTab}
        />
      </View>

      {/* Lista de filmes */}
      {activeData.length === 0 ? (
        <EmptyState
          emoji={activeTab === 'watched' ? "✅" : "⭐"}
          title={
            activeTab === 'watched' 
              ? "Nenhum filme assistido" 
              : "Nenhum filme na lista"
          }
          subtitle={
            activeTab === 'watched'
              ? "Marque filmes como 'Já assisti' para vê-los aqui"
              : "Marque filmes como 'Quero assistir' para vê-los aqui"
          }
          actionText="Descobrir filmes"
          onAction={() => {/* Navegar para home ou busca */}}
        />
      ) : (
        <FlatList
          data={activeData}
          keyExtractor={(item) => `${activeTab}-${item.id}`}
          renderItem={renderMovieGrid}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          
          // Pull-to-refresh
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={["#E50914"]}
              tintColor="#E50914"
              title="Puxe para atualizar"
              titleColor="#666"
            />
          }
          
          // Header da seção
          ListHeaderComponent={() => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {activeTab === 'watched' ? '🎬 Filmes assistidos' : '⭐ Quero assistir'}
              </Text>
              <Text style={styles.sectionCount}>
                {activeData.length} filme{activeData.length !== 1 ? 's' : ''}
              </Text>
            </View>
          )}
          
          // Otimizações
          removeClippedSubviews={true}
          maxToRenderPerBatch={6}
          initialNumToRender={6}
          windowSize={10}
          
          // Acessibilidade
          accessible={true}
          accessibilityLabel={`Lista de filmes ${activeTab === 'watched' ? 'assistidos' : 'para assistir'}`}
        />
      )}

      {/* Resumo rápido na parte inferior */}
      {stats.totalCount > 0 && (
        <View style={styles.bottomSummary}>
          <Text style={styles.summaryText}>
            📊 {stats.watchedCount} assistido{stats.watchedCount !== 1 ? 's' : ''} • 
            {stats.wantToWatchCount} na lista
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  tabButtonActive: {
    borderBottomWidth: 3,
    borderBottomColor: '#E50914',
  },
  tabButtonText: {
    fontSize: 16,
    color: '#666',
    marginRight: 8,
  },
  tabButtonTextActive: {
    color: '#E50914',
    fontWeight: '600',
  },
  badge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeActive: {
    backgroundColor: '#E50914',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  badgeTextActive: {
    color: '#fff',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#f8f8f8',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  sectionCount: {
    fontSize: 14,
    color: '#666',
  },
  list: {
    padding: 10,
    paddingBottom: 80, // Espaço para o summary
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  horizontalMovieContainer: {
    marginRight: 10,
    width: width * 0.4,
  },
  bottomSummary: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  summaryText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
  },
});