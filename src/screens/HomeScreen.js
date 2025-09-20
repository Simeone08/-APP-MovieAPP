import React, { useEffect, useState } from "react";
import { View, FlatList } from "react-native";
import { getPopularMovies } from "../api/tmdb";
import MovieCard from "../components/MovieCard";

export default function HomeScreen() {
  const [movies, setMovies] = useState([]);

  useEffect(() => {
    getPopularMovies().then(setMovies);
  }, []);

  return (
    <View>
      <FlatList
        data={movies}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <MovieCard movie={item} />}
      />
    </View>
  );
}
