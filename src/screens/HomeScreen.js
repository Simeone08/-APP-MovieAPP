import React, { useState, useCallback, useRef } from "react";
import {
  View,
  FlatList,
  RefreshControl,
  StyleSheet,
  Dimensions,
  StatusBar,
  Text,
} from "react-native";
import { getPopularMovies } from "../api/tmdb";
import useFetch from "../hooks/useFetch";
import MovieCard from "../components/MovieCard";
//import { LoadingSpinner, ErrorMessage, NetworkStatus, RetryBanner } from "../components/UtilityComponents";

const { width, height } = Dimensions.get('window');
const HEADER_HEIGHT = 60;
const CARD_MARGIN = 12;
const CARD_PADDING = 16;
const CARD_WIDTH = (width - (CARD_PADDING * 2) - CARD_MARGIN) / 2;

export default function HomeScreen() {
  const [page, setPage] = useState(1);
  const [movies, setMovies] = useState([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(true);
  
  // Referências para controle
  const flatListRef = useRef(null);
  const currentPageRef = useRef(1);
  const isLoadingMoreRef = useRef(false);

  // Função para buscar filmes com paginação
  const fetchMovies = useCallback(async ({ signal } = {}) => {
    const response = await getPopularMovies(currentPageRef.current);
    return response;
  }, []);

  const { data, loading, error, refetch, isRetrying } = useFetch(
    fetchMovies,
    [page],
    { page }
  );

  // Atualiza lista quando recebe novos dados
  React.useEffect(() => {
    if (data?.results) {
      if (currentPageRef.current === 1) {
        setMovies(data.results);
      } else {
        setMovies(prevMovies => {
          const newMovies = data.results.filter(
            newMovie => !prevMovies.some(existingMovie => existingMovie.id === newMovie.id)
          );
          return [...prevMovies, ...newMovies];
        });
      }
      
      setHasNextPage(data.page < data.total_pages);
      setIsLoadingMore(false);
      isLoadingMoreRef.current = false;
    }
  }, [data]);

  // Função para carregar mais filmes
  const loadMore = useCallback(() => {
    if (isLoadingMoreRef.current || loading || !hasNextPage || error) return;
    
    isLoadingMoreRef.current = true;
    setIsLoadingMore(true);
    currentPageRef.current += 1;
    setPage(currentPageRef.current);
  }, [loading, hasNextPage, error]);

  // Função de refresh
  const handleRefresh = useCallback(() => {
    currentPageRef.current = 1;
    setPage(1);
    setMovies([]);
    setHasNextPage(true);
    refetch();
  }, [refetch]);

  // Callback quando status do filme muda
  const handleMovieStatusChange = useCallback((movieId, newStatus, previousStatus) => {
    console.log(`Filme ${movieId} mudou de ${previousStatus} para ${newStatus}`);
  }, []);

  // Renderizador de filme
  const renderMovie = useCallback(({ item, index }) => (
    <View style={[
      styles.movieContainer,
      index % 2 === 0 ? styles.leftMovie : styles.rightMovie
    ]}>
      <MovieCard 
        movie={item} 
        onStatusChange={handleMovieStatusChange}
      />
    </View>
  ), [handleMovieStatusChange]);

  // Renderizador de header
  const renderHeader = useCallback(() => (
    <View style={styles.headerContainer}>
      <View style={styles.headerContent}>
        <Text style={styles.headerTitle}>Filmes Populares</Text>
        <Text style={styles.headerSubtitle}>
          Descubra os filmes mais assistidos do momento
        </Text>
      </View>
      <View style={styles.headerDivider} />
    </View>
  ), []);

  // Renderizador de footer
  const renderFooter = useCallback(() => {
    if (!isLoadingMore) return <View style={styles.bottomPadding} />;
    
    return (
      <View style={styles.footerContainer}>
        <View style={styles.footerLoader}>
          
        </View>
      </View>
    );
  }, [isLoadingMore]);

  // Separador entre seções
  const ItemSeparatorComponent = useCallback(() => (
    <View style={styles.itemSeparator} />
  ), []);

  // Loading inicial
  if (loading && movies.length === 0) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
        <View style={styles.gradientBackground}>
          
          <View style={styles.centerContent}>
            
          </View>
        </View>
      </View>
    );
  }

  // Erro sem dados
  if (error && movies.length === 0) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
        <View style={styles.gradientBackground}>
        
          <View style={styles.centerContent}>
            <ErrorMessage 
              message={error} 
              onRetry={handleRefresh}
              retryText="Descobrir filmes"
            />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      
      {/* Background gradient */}
      <View style={styles.gradientBackground}>
        
        <FlatList
          ref={flatListRef}
          data={movies}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderMovie}
          numColumns={2}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          
          // Headers e Footers
          ListHeaderComponent={renderHeader}
          ListFooterComponent={renderFooter}
          ItemSeparatorComponent={ItemSeparatorComponent}
          
          // Otimizações de performance
          removeClippedSubviews={true}
          maxToRenderPerBatch={8}
          updateCellsBatchingPeriod={50}
          initialNumToRender={6}
          windowSize={10}
          
          // Paginação
          onEndReached={loadMore}
          onEndReachedThreshold={0.2}
          
          // Pull-to-refresh
          refreshControl={
            <RefreshControl
              refreshing={loading && currentPageRef.current === 1}
              onRefresh={handleRefresh}
              colors={["#E50914", "#FF6B35"]}
              tintColor="#E50914"
              title="Atualizando filmes..."
              titleColor="#fff"
              progressBackgroundColor="#2a2a2a"
            />
          }
          
          // Acessibilidade
          accessible={true}
          accessibilityLabel="Lista de filmes populares"
          accessibilityRole="list"
        />
        
        {/* Floating action hint */}
        {movies.length > 0 && hasNextPage && !isLoadingMore && (
          <View style={styles.scrollHint}>
            <Text style={styles.scrollHintText}>
              ↓ Role para descobrir mais filmes
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  
  gradientBackground: {
    flex: 1,
    backgroundColor: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 50%, #1a1a1a 100%)',
    // Fallback para React Native
    backgroundColor: '#1a1a1a',
  },
  
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  
  // Header Styles
  headerContainer: {
    paddingTop: 20,
    paddingHorizontal: CARD_PADDING,
    paddingBottom: 24,
    backgroundColor: 'rgba(26, 26, 26, 0.95)',
    backdropFilter: 'blur(10px)',
  },
  
  headerContent: {
    alignItems: 'center',
    marginBottom: 16,
  },
  
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  
  headerSubtitle: {
    fontSize: 16,
    color: '#cccccc',
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '400',
    opacity: 0.8,
  },
  
  headerDivider: {
    height: 3,
    backgroundColor: '#E50914',
    borderRadius: 2,
    width: 60,
    alignSelf: 'center',
    shadowColor: '#E50914',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 4,
  },
  
  // List Styles
  listContainer: {
    paddingBottom: 40,
    minHeight: height,
  },
  
  movieContainer: {
    flex: 1,
    marginVertical: 8,
    maxWidth: CARD_WIDTH,
  },
  
  leftMovie: {
    marginLeft: CARD_PADDING,
    marginRight: CARD_MARGIN / 2,
  },
  
  rightMovie: {
    marginRight: CARD_PADDING,
    marginLeft: CARD_MARGIN / 2,
  },
  
  itemSeparator: {
    height: 4,
  },
  
  // Footer Styles
  footerContainer: {
    paddingVertical: 32,
    paddingHorizontal: CARD_PADDING,
  },
  
  footerLoader: {
    backgroundColor: 'rgba(42, 42, 42, 0.8)',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 24,
    alignItems: 'center',
    backdropFilter: 'blur(10px)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  
  bottomPadding: {
    height: 60,
  },
  
  // Scroll Hint
  scrollHint: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
    pointerEvents: 'none',
  },
  
  scrollHintText: {
    backgroundColor: 'rgba(229, 9, 20, 0.9)',
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    overflow: 'hidden',
    textAlign: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  
  // Responsive adjustments
  '@media (max-width: 360)': {
    headerTitle: {
      fontSize: 28,
    },
    headerSubtitle: {
      fontSize: 14,
    },
    movieContainer: {
      marginVertical: 6,
    },
  },
  
  '@media (min-width: 768)': {
    headerTitle: {
      fontSize: 36,
    },
    listContainer: {
      paddingHorizontal: 32,
    },
    movieContainer: {
      marginVertical: 10,
    },
  },
});