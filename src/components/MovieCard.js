import React from "react";
import { View, Text, Image, Button } from "react-native";
import { saveMovieStatus } from "../storage/movieStorage";

export default function MovieCard({ movie }) {
  const handleSave = (status) => {
    saveMovieStatus(movie.id, status);
  };

  return (
    <View style={{ margin: 10, padding: 10, backgroundColor: "#fff", borderRadius: 8 }}>
      <Image
        source={{ uri: `https://image.tmdb.org/t/p/w500${movie.poster_path}` }}
        style={{ width: 120, height: 180, borderRadius: 8 }}
      />
      <Text style={{ fontWeight: "bold", marginTop: 5 }}>{movie.title}</Text>
      <Button title="Já assisti" onPress={() => handleSave("watched")} />
      <Button title="Quero assistir" onPress={() => handleSave("wantToWatch")} />
    </View>
  );
}
