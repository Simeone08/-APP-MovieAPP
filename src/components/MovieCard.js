import React, { useState, useEffect, useCallback, memo } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, ActivityIndicator, Dimensions } from "react-native";
import { saveMovieStatus, getMovieStatus } from "../storage/movieStorage";
import { getImageUrl } from "../api/tmdb";

const { width } = Dimensions.get('window');
const CARD_MARGIN = 12;
const CARD_PADDING = 16;

const MovieCard = memo(({ movie, onStatusChange }) => {
  const [status, setStatus] = useState(null);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadStatus = async () => {
      try {
        const statuses = await getMovieStatus();
        const movieStatus = statuses[movie.id]?.status || null;
        setStatus(movieStatus);
      } catch (error) {
        console.error('Erro ao carregar status do filme:', error);
      }
    };
    
    loadStatus();
  }, [movie.id]);

  const handleSave = useCallback(async (newStatus) => {
    if (saving) return;
    
    try {
      setSaving(true);
      const previousStatus = status;
      setStatus(newStatus);
      
      await saveMovieStatus(movie, newStatus);
      
      if (onStatusChange) {
        onStatusChange(movie.id, newStatus, previousStatus);
      }
      
    } catch (error) {
      console.error('Erro ao salvar status:', error);
      setStatus(status);
    } finally {
      setSaving(false);
    }
  }, [movie, status, saving, onStatusChange]);

  const imageUrl = getImageUrl(movie.poster_path, 'w500');
  const placeholderUrl = 'https://via.placeholder.com/500x750/2a2a2a/666666?text=🎬';

  return (
    <TouchableOpacity style={styles.cardContainer} activeOpacity={0.9}>
      {/* Card Background with Gradient */}
      <View style={styles.card}>
        
        {/* Image Container */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: imageError || !imageUrl ? placeholderUrl : imageUrl }}
            style={styles.poster}
            onLoadStart={() => setImageLoading(true)}
            onLoad={() => setImageLoading(false)}
            onError={() => {
              setImageError(true);
              setImageLoading(false);
            }}
            onLoadEnd={() => setImageLoading(false)}
          />
          
          {/* Image Loading Overlay */}
          {imageLoading && !imageError && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="small" color="#E50914" />
            </View>
          )}
          
          {/* Rating Badge */}
          {movie.vote_average > 0 && (
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingText}>
                ⭐ {movie.vote_average.toFixed(1)}
              </Text>
            </View>
          )}
          
          {/* Status Indicator */}
          {status && (
            <View style={[
              styles.statusIndicator, 
              status === 'watched' ? styles.watchedIndicator : styles.wantToWatchIndicator
            ]}>
              <Text style={styles.statusIcon}>
                {status === 'watched' ? '✓' : '⭐'}
              </Text>
            </View>
          )}
        </View>
        
        {/* Content Container */}
        <View style={styles.contentContainer}>
          
          {/* Movie Title */}
          <Text style={styles.title} numberOfLines={2}>
            {movie.title}
          </Text>
          
          {/* Movie Year */}
          {movie.release_date && (
            <Text style={styles.year}>
              {new Date(movie.release_date).getFullYear()}
            </Text>
          )}
          
          {/* Action Buttons */}
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.watchedButton,
                status === "watched" && styles.activeWatchedButton,
                saving && styles.disabledButton
              ]}
              onPress={() => handleSave("watched")}
              disabled={saving}
              activeOpacity={0.8}
            >
              <View style={styles.buttonContent}>
                <Text style={styles.buttonIcon}>
                  {saving && status === "watched" ? "⏳" : "✓"}
                </Text>
                <Text style={[
                  styles.buttonText,
                  status === "watched" && styles.activeButtonText
                ]}>
                  Assisti
                </Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.wantToWatchButton,
                status === "wantToWatch" && styles.activeWantToWatchButton,
                saving && styles.disabledButton
              ]}
              onPress={() => handleSave("wantToWatch")}
              disabled={saving}
              activeOpacity={0.8}
            >
              <View style={styles.buttonContent}>
                <Text style={styles.buttonIcon}>
                  {saving && status === "wantToWatch" ? "⏳" : "⭐"}
                </Text>
                <Text style={[
                  styles.buttonText,
                  status === "wantToWatch" && styles.activeButtonText
                ]}>
                  Quero ver
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Glass Effect Overlay */}
        <View style={styles.glassOverlay} />
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  cardContainer: {
    flex: 1,
    marginBottom: 16,
  },
  
  card: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 20,
    overflow: 'hidden',
    minHeight: 380,
    position: 'relative',
    
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    
    // Elevation for Android
    elevation: 8,
    
    // Border glow effect
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  
  // Image Styles
  imageContainer: {
    height: 240,
    position: 'relative',
    backgroundColor: '#1a1a1a',
  },
  
  poster: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(42, 42, 42, 0.8)',
    backdropFilter: 'blur(4px)',
  },
  
  ratingBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backdropFilter: 'blur(10px)',
  },
  
  ratingText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  
  statusIndicator: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  
  watchedIndicator: {
    backgroundColor: 'rgba(34, 197, 94, 0.9)', // Green
  },
  
  wantToWatchIndicator: {
    backgroundColor: 'rgba(249, 115, 22, 0.9)', // Orange
  },
  
  statusIcon: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
  
  // Content Styles
  contentContainer: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    lineHeight: 20,
    marginBottom: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  
  year: {
    fontSize: 13,
    color: '#999999',
    fontWeight: '500',
    marginBottom: 16,
    opacity: 0.8,
  },
  
  // Button Styles
  buttonsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  
  watchedButton: {
    backgroundColor: 'rgba(68, 68, 68, 0.8)',
  },
  
  activeWatchedButton: {
    backgroundColor: 'rgba(34, 197, 94, 0.9)',
    borderColor: 'rgba(34, 197, 94, 0.3)',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  
  wantToWatchButton: {
    backgroundColor: 'rgba(68, 68, 68, 0.8)',
  },
  
  activeWantToWatchButton: {
    backgroundColor: 'rgba(249, 115, 22, 0.9)',
    borderColor: 'rgba(249, 115, 22, 0.3)',
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  
  disabledButton: {
    opacity: 0.6,
  },
  
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
  },
  
  buttonIcon: {
    fontSize: 10,
    color: '#fff',
  },
  
  buttonText: {
    fontSize: 10,
    color: '#cccccc',
    fontWeight: '600',
    textAlign: 'center',
  },
  
  activeButtonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  
  // Glass Effect
  glassOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    pointerEvents: 'none',
  },
  
  // Responsive Styles
  '@media (max-width: 360)': {
    card: {
      minHeight: 360,
    },
    imageContainer: {
      height: 220,
    },
    title: {
      fontSize: 14,
    },
    buttonText: {
      fontSize: 11,
    },
  },
  
  '@media (min-width: 768)': {
    card: {
      minHeight: 420,
      borderRadius: 24,
    },
    imageContainer: {
      height: 280,
    },
    title: {
      fontSize: 18,
    },
    contentContainer: {
      padding: 20,
    },
    actionButton: {
      paddingVertical: 14,
    },
  },
});

export default MovieCard;