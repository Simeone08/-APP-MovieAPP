import React, { useState, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  Share,
  Linking,
  Alert,
} from 'react-native';
import { getImageUrl } from '../api/tmdb';
import { saveMovieStatus } from '../storage/movieStorage';
import ReminderModal from './ReminderModal';

const { width, height } = Dimensions.get('window');

export default function MovieDetailModal({ visible, movie, onClose, currentStatus, onStatusChange }) {
  const [status, setStatus] = useState(currentStatus);
  const [saving, setSaving] = useState(false);
  const [reminderModalVisible, setReminderModalVisible] = useState(false);

  const handleStatusChange = useCallback(async (newStatus) => {
    if (saving) return;
    
    try {
      setSaving(true);
      const previousStatus = status;
      setStatus(newStatus);
      
      await saveMovieStatus(movie, newStatus);
      
      if (onStatusChange) {
        onStatusChange(movie.id, newStatus, previousStatus);
      }
      
      Alert.alert(
        '✅ Sucesso!', 
        `Filme marcado como "${newStatus === 'watched' ? 'assistido' : 'quero assistir'}"`
      );
    } catch (error) {
      console.error('Erro ao salvar status:', error);
      setStatus(status); // Reverte
      Alert.alert('Erro', 'Não foi possível salvar o status');
    } finally {
      setSaving(false);
    }
  }, [movie, status, saving, onStatusChange]);

  const handleShare = useCallback(async () => {
    try {
      const message = `🎬 ${movie.title}\n\n${movie.overview || 'Confira este filme!'}\n\n⭐ Nota: ${movie.vote_average}/10`;
      
      await Share.share({
        message,
        title: movie.title,
      });
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
    }
  }, [movie]);

  const handleSearchTrailer = useCallback(() => {
    const query = `${movie.title} trailer`;
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Erro', 'Não foi possível abrir o YouTube');
    });
  }, [movie.title]);

  const openReminder = useCallback(() => {
    setReminderModalVisible(true);
  }, []);

  if (!movie) return null;

  const imageUrl = getImageUrl(movie.poster_path, 'w780');
  const backdropUrl = getImageUrl(movie.backdrop_path, 'w1280');
  const releaseYear = movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A';
  const genres = movie.genre_ids ? movie.genre_ids.slice(0, 3).join(' • ') : '';

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
        <View style={styles.container}>
          
          {/* Header com backdrop E poster/título sobrepostos */}
          <View style={styles.header}>
            {backdropUrl && (
              <Image 
                source={{ uri: backdropUrl }} 
                style={styles.backdrop}
                resizeMode="cover"
              />
            )}
            
            {/* Overlay escuro sobre backdrop */}
            <View style={styles.headerOverlay}>
              
              {/* Botões de controle no topo */}
              <View style={styles.controlButtons}>
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
                  <Text style={styles.shareButtonText}>📤</Text>
                </TouchableOpacity>
              </View>

              {/* Poster e Título sobrepostos no backdrop */}
              <View style={styles.overlayContent}>
                <View style={styles.posterContainer}>
                  <Image 
                    source={{ uri: imageUrl || 'https://via.placeholder.com/300x450/333/999?text=🎬' }}
                    style={styles.poster}
                    resizeMode="cover"
                  />
                  {movie.vote_average > 0 && (
                    <View style={styles.ratingBadge}>
                      <Text style={styles.ratingText}>⭐ {movie.vote_average.toFixed(1)}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.titleContainer}>
                  <Text style={styles.title}>{movie.title}</Text>
                  
                  <View style={styles.metaInfo}>
                    <Text style={styles.year}>{releaseYear}</Text>
                    {genres && <Text style={styles.genres}> • {genres}</Text>}
                  </View>

                  {movie.release_date && (
                    <Text style={styles.releaseDate}>
                      📅 {new Date(movie.release_date).toLocaleDateString('pt-BR')}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

            {/* Sinopse */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📖 Sinopse</Text>
              <Text style={styles.overview}>
                {movie.overview || 'Sinopse não disponível para este filme.'}
              </Text>
            </View>

            {/* Botões de Ação */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>⚡ Ações</Text>
              
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    styles.watchedButton,
                    status === 'watched' && styles.activeButton
                  ]}
                  onPress={() => handleStatusChange('watched')}
                  disabled={saving}
                >
                  <Text style={styles.actionButtonIcon}>✓</Text>
                  <Text style={[
                    styles.actionButtonText,
                    status === 'watched' && styles.activeButtonText
                  ]}>
                    {saving && status === 'watched' ? 'Salvando...' : 'Já Assisti'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    styles.wantToWatchButton,
                    status === 'wantToWatch' && styles.activeButton
                  ]}
                  onPress={() => handleStatusChange('wantToWatch')}
                  disabled={saving}
                >
                  <Text style={styles.actionButtonIcon}>⭐</Text>
                  <Text style={[
                    styles.actionButtonText,
                    status === 'wantToWatch' && styles.activeButtonText
                  ]}>
                    {saving && status === 'wantToWatch' ? 'Salvando...' : 'Quero Assistir'}
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.reminderButton} onPress={openReminder}>
                <Text style={styles.reminderButtonIcon}>⏰</Text>
                <Text style={styles.reminderButtonText}>Agendar Lembrete</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.trailerButton} onPress={handleSearchTrailer}>
                <Text style={styles.trailerButtonIcon}>▶️</Text>
                <Text style={styles.trailerButtonText}>Buscar Trailer</Text>
              </TouchableOpacity>
            </View>

            {/* Informações Técnicas */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>ℹ️ Informações</Text>
              <View style={styles.techInfo}>
                <View style={styles.techItem}>
                  <Text style={styles.techLabel}>Avaliação</Text>
                  <Text style={styles.techValue}>
                    {movie.vote_average > 0 ? `${movie.vote_average}/10` : 'N/A'}
                  </Text>
                </View>
                
                <View style={styles.techItem}>
                  <Text style={styles.techLabel}>Popularidade</Text>
                  <Text style={styles.techValue}>
                    {movie.popularity ? Math.round(movie.popularity) : 'N/A'}
                  </Text>
                </View>
                
                <View style={styles.techItem}>
                  <Text style={styles.techLabel}>Idioma Original</Text>
                  <Text style={styles.techValue}>
                    {movie.original_language?.toUpperCase() || 'N/A'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Espaço final */}
            <View style={styles.bottomSpace} />
          </ScrollView>
        </View>
      </Modal>

      {/* Modal de Lembrete */}
      <ReminderModal
        visible={reminderModalVisible}
        movie={movie}
        onClose={() => setReminderModalVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  
  header: {
    height: 280,
    position: 'relative',
  },
  
  backdrop: {
    width: '100%',
    height: '100%',
  },
  
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)', // Overlay mais escuro para destaque
    justifyContent: 'space-between',
  },
  
  controlButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  
  closeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  
  shareButtonText: {
    fontSize: 16,
  },
  
  overlayContent: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  
  posterContainer: {
    position: 'relative',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  
  poster: {
    width: 120,
    height: 180,
    borderRadius: 12,
    backgroundColor: '#333',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  
  ratingBadge: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: '#E50914',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: '#E50914',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 6,
  },
  
  ratingText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  
  titleContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 10,
  },
  
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    lineHeight: 28,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  
  year: {
    fontSize: 16,
    color: '#E50914',
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  
  genres: {
    fontSize: 14,
    color: '#ffffff',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  
  releaseDate: {
    fontSize: 14,
    color: '#ffffff',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  
  content: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  
  section: {
    padding: 20,
    paddingTop: 0,
  },
  
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  
  overview: {
    fontSize: 16,
    color: '#ddd',
    lineHeight: 24,
    textAlign: 'justify',
  },
  
  actionButtons: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#333',
    borderWidth: 1,
    borderColor: '#444',
  },
  
  watchedButton: {
    backgroundColor: '#2a5d2a',
  },
  
  wantToWatchButton: {
    backgroundColor: '#5d4a2a',
  },
  
  activeButton: {
    backgroundColor: '#E50914',
    borderColor: '#E50914',
  },
  
  actionButtonIcon: {
    fontSize: 16,
    color: '#fff',
    marginRight: 8,
  },
  
  actionButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  
  activeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  
  reminderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#4a4a4a',
    marginBottom: 12,
  },
  
  reminderButtonIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  
  reminderButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  
  trailerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#E50914',
  },
  
  trailerButtonIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  
  trailerButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  
  techInfo: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
  },
  
  techItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  
  techLabel: {
    fontSize: 14,
    color: '#999',
  },
  
  techValue: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  
  bottomSpace: {
    height: 40,
  },
});