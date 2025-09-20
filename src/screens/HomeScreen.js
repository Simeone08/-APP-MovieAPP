import React, { useEffect, useState } from "react";
import { View, FlatList, StyleSheet } from "react-native";
import { getPopularMovies } from "../api/tmdb";
import MovieCard from "../components/MovieCard";

export default function HomeScreen() {
  const [movies, setMovies] = useState([]);

  useEffect(() => {
    getPopularMovies().then(setMovies);
  }, []);

  return (
    <View style={ styles.container }>
      <FlatList
        data={movies}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <MovieCard movie={item} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 50,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

