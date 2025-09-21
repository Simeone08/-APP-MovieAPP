import axios from "axios";
import { TMDB_API_KEY, TMDB_BASE_URL, TMDB_LANG } from "@env";

// Instância centralizada do axios com interceptors
const api = axios.create({
  baseURL: TMDB_BASE_URL,
  timeout: 10000, // 10 segundos de timeout
  params: {
    api_key: TMDB_API_KEY,
    language: TMDB_LANG,
  },
});

// Interceptor para tratamento de erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      throw new Error('Tempo limite excedido. Verifique sua conexão.');
    }
    
    if (error.response) {
      const { status, data } = error.response;
      switch (status) {
        case 401:
          throw new Error('Chave da API inválida');
        case 404:
          throw new Error('Recurso não encontrado');
        case 429:
          throw new Error('Muitas requisições. Tente novamente em alguns segundos.');
        case 500:
          throw new Error('Erro interno do servidor. Tente novamente mais tarde.');
        default:
          throw new Error(data?.status_message || `Erro ${status}: Falha na requisição`);
      }
    }
    
    if (error.request) {
      throw new Error('Sem conexão com a internet. Verifique sua conexão.');
    }
    
    throw new Error('Erro inesperado. Tente novamente.');
  }
);

// Função auxiliar para validar dados
const validateMovieData = (movie) => {
  return movie && 
         typeof movie.id === 'number' && 
         typeof movie.title === 'string' &&
         movie.title.trim() !== '';
};

export const getPopularMovies = async (page = 1) => {
  try {
    const response = await api.get("/movie/popular", { 
      params: { page: Math.max(1, Math.min(page, 1000)) } // Limita páginas válidas
    });
    
    if (!response.data || !Array.isArray(response.data.results)) {
      throw new Error('Formato de dados inválido recebido da API');
    }
    
    // Filtra filmes válidos
    const validMovies = response.data.results.filter(validateMovieData);
    
    return {
      ...response.data,
      results: validMovies
    };
  } catch (error) {
    console.error('Erro ao buscar filmes populares:', error);
    throw error;
  }
};

export const searchMovies = async (query, page = 1) => {
  try {
    if (!query || query.trim().length < 2) {
      throw new Error('Busca deve ter pelo menos 2 caracteres');
    }
    
    const response = await api.get("/search/movie", { 
      params: { 
        query: query.trim(),
        page: Math.max(1, Math.min(page, 1000))
      } 
    });
    
    if (!response.data || !Array.isArray(response.data.results)) {
      throw new Error('Formato de dados inválido recebido da API');
    }
    
    // Filtra e retorna apenas filmes válidos
    return response.data.results.filter(validateMovieData);
  } catch (error) {
    console.error('Erro ao buscar filmes:', error);
    throw error;
  }
};

// Nova função para obter detalhes do filme
export const getMovieDetails = async (movieId) => {
  try {
    if (!movieId || isNaN(movieId)) {
      throw new Error('ID do filme inválido');
    }
    
    const response = await api.get(`/movie/${movieId}`);
    
    if (!response.data || !validateMovieData(response.data)) {
      throw new Error('Dados do filme inválidos');
    }
    
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar detalhes do filme:', error);
    throw error;
  }
};

// Função para construir URL de imagem com fallback
export const getImageUrl = (path, size = 'w500') => {
  if (!path) return null;
  return `https://image.tmdb.org/t/p/${size}${path}`;
};

export default api;