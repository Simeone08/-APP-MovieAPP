import axios from "axios";

const API_KEY = "fac79ca4e3e4b4483aea773ad604bf84";
const BASE_URL = "https://api.themoviedb.org/3";

export const getPopularMovies = async () => {
  const response = await axios.get(`${BASE_URL}/movie/popular?api_key=${API_KEY}&language=pt-BR`);
  return response.data.results;
};

export const searchMovies = async (query) => {
  const response = await axios.get(`${BASE_URL}/search/movie?api_key=${API_KEY}&language=pt-BR&query=${query}`);
  return response.data.results;
};
