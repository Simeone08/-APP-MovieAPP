import React, { useState } from "react";
import { View, TextInput, Button, FlatList } from "react-native";
import { searchMovies } from "../api/tmdb";
import MovieCard from "../components/MovieCard";

export default function SearchScreen() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  const handleSearch = () => {
    searchMovies(query).then(setResults);
  };

  return (
    <View style={{marginTop:100, padding: 10 }}>
      <TextInput
        placeholder="Buscar filme..."
        value={query}
        onChangeText={setQuery}
        style={{ borderBottomWidth: 1, marginBottom: 10 }}
      />
      <Button title="Buscar" onPress={handleSearch} />
      <FlatList
        data={results}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <MovieCard movie={item} />}
      />
    </View>
  );
}
