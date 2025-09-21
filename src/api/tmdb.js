import axios from "axios";
import { TMDB_API_KEY, TMDB_BASE_URL, TMDB_LANG } from "@env";

export const getPopularMovies = async () => {
  const response = await axios.get(
    `${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}&language=${TMDB_LANG}`
  );
  return response.data.results;
};

export const searchMovies = async (query) => {
  const response = await axios.get(
    `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&language=${TMDB_LANG}&query=${query}`
  );
  return response.data.results;
};
