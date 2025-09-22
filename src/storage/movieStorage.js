import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "movies_status";
const CACHE_EXPIRY = 24 * 60 * 60 * 1000;
const MAX_STORAGE_SIZE = 1000;
const BACKUP_KEY = "movies_backup";
const SETTINGS_KEY = "app_settings";

// Cache em memória para melhor performance
let memoryCache = null;
let cacheTimestamp = null;

// Configurações padrão
const DEFAULT_SETTINGS = {
  autoBackup: true,
  maxStorageSize: MAX_STORAGE_SIZE,
  cacheExpiry: CACHE_EXPIRY,
  sortOrder: 'recent', // 'recent', 'alphabetical', 'rating'
  theme: 'dark',
  notifications: true,
};

// Validação de dados do filme
const validateMovieData = (movie) => {
  if (!movie || typeof movie !== 'object') {
    return false;
  }
  
  return movie.id && 
         typeof movie.id === 'number' && 
         movie.title && 
         typeof movie.title === 'string' &&
         movie.title.trim() !== '' &&
         movie.status &&
         ['watched', 'wantToWatch'].includes(movie.status);
};

// Função para comprimir dados (remove campos desnecessários)
const compressMovieData = (movie) => {
  return {
    id: movie.id,
    title: movie.title,
    poster_path: movie.poster_path || null,
    release_date: movie.release_date || null,
    vote_average: movie.vote_average || 0,
    overview: movie.overview ? movie.overview.substring(0, 200) : null, // Limita descrição
    genre_ids: movie.genre_ids || [],
  };
};

// Função para carregar configurações
const loadSettings = async () => {
  try {
    const data = await AsyncStorage.getItem(SETTINGS_KEY);
    return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
  } catch (error) {
    console.error("Erro ao carregar configurações:", error);
    return DEFAULT_SETTINGS;
  }
};

// Função para salvar configurações
const saveSettings = async (settings) => {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    return true;
  } catch (error) {
    console.error("Erro ao salvar configurações:", error);
    return false;
  }
};

// Função para carregar dados do storage com cache
const loadFromStorage = async () => {
  try {
    // Verifica se o cache em memória ainda é válido
    if (memoryCache && cacheTimestamp && 
        (Date.now() - cacheTimestamp < CACHE_EXPIRY)) {
      return memoryCache;
    }

    const data = await AsyncStorage.getItem(STORAGE_KEY);
    const parsed = data ? JSON.parse(data) : {};

    // Valida e limpa dados inválidos de forma mais robusta
    const validData = {};
    Object.entries(parsed).forEach(([id, movieData]) => {
      // Verifica se movieData é um objeto válido
      if (typeof movieData === 'object' && movieData !== null && validateMovieData(movieData)) {
        validData[id] = movieData;
      } else {
        console.warn(`Dados inválidos encontrados para filme ${id}:`, movieData);
      }
    });

    // Se houve limpeza de dados inválidos, salva a versão limpa
    if (Object.keys(validData).length !== Object.keys(parsed).length) {
      console.log(`Limpando ${Object.keys(parsed).length - Object.keys(validData).length} entradas inválidas`);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(validData));
    }

    // Atualiza cache em memória
    memoryCache = validData;
    cacheTimestamp = Date.now();

    return validData;
  } catch (error) {
    console.error("Erro ao carregar dados do storage:", error);
    
    // Em caso de erro de parsing, tenta recuperar
    try {
      console.warn("Tentando recuperação após erro de parsing...");
      await AsyncStorage.removeItem(STORAGE_KEY);
      return {};
    } catch (recoveryError) {
      console.error("Erro na recuperação:", recoveryError);
      return {};
    }
  }
};

// Função para salvar dados no storage
const saveToStorage = async (data) => {
  try {
    const settings = await loadSettings();
    
    // Limita o tamanho do storage
    const entries = Object.entries(data);
    if (entries.length > settings.maxStorageSize) {
      // Mantém apenas os mais recentes (baseado em timestamp de modificação)
      const sortedEntries = entries
        .sort((a, b) => (b[1].updatedAt || 0) - (a[1].updatedAt || 0))
        .slice(0, settings.maxStorageSize);
      data = Object.fromEntries(sortedEntries);
    }

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    
    // Atualiza cache em memória
    memoryCache = data;
    cacheTimestamp = Date.now();
    
    // Auto-backup se habilitado
    if (settings.autoBackup) {
      await createBackup(data);
    }
    
    return true;
  } catch (error) {
    console.error("Erro ao salvar dados no storage:", error);
    return false;
  }
};

// Função para criar backup automático
const createBackup = async (data = null) => {
  try {
    if (!data) {
      data = await loadFromStorage();
    }
    
    const backup = {
      data,
      timestamp: Date.now(),
      version: "1.0",
      movieCount: Object.keys(data).length,
    };
    
    await AsyncStorage.setItem(BACKUP_KEY, JSON.stringify(backup));
    return true;
  } catch (error) {
    console.error("Erro ao criar backup:", error);
    return false;
  }
};

// Função para restaurar backup
const restoreFromBackup = async () => {
  try {
    const backupData = await AsyncStorage.getItem(BACKUP_KEY);
    if (!backupData) {
      throw new Error("Nenhum backup encontrado");
    }
    
    const backup = JSON.parse(backupData);
    if (!backup.data) {
      throw new Error("Backup inválido");
    }
    
    await saveToStorage(backup.data);
    return backup.movieCount;
  } catch (error) {
    console.error("Erro ao restaurar backup:", error);
    throw error;
  }
};

// Função principal para salvar status do filme
export const saveMovieStatus = async (movie, status) => {
  try {
    if (!validateMovieData({ ...movie, status })) {
      throw new Error("Dados do filme inválidos");
    }

    const data = await loadFromStorage();
    
    // Comprime dados do filme para economizar espaço
    const compressedMovie = compressMovieData(movie);
    
    data[movie.id] = {
      ...compressedMovie,
      status,
      updatedAt: Date.now(),
      addedAt: data[movie.id]?.addedAt || Date.now(), // Preserva data de adição
    };

    const success = await saveToStorage(data);
    if (!success) {
      throw new Error("Falha ao salvar no storage");
    }

    return true;
  } catch (error) {
    console.error("Erro ao salvar status do filme:", error);
    throw error;
  }
};

// Função para remover filme do storage
export const removeMovieStatus = async (movieId) => {
  try {
    if (!movieId || isNaN(movieId)) {
      throw new Error("ID do filme inválido");
    }

    const data = await loadFromStorage();
    
    if (data[movieId]) {
      delete data[movieId];
      await saveToStorage(data);
    }

    return true;
  } catch (error) {
    console.error("Erro ao remover filme:", error);
    throw error;
  }
};

// Função para obter todos os status
export const getMovieStatus = async () => {
  try {
    return await loadFromStorage();
  } catch (error) {
    console.error("Erro ao carregar status dos filmes:", error);
    return {};
  }
};

// Função para obter status de um filme específico
export const getSpecificMovieStatus = async (movieId) => {
  try {
    if (!movieId || isNaN(movieId)) {
      return null;
    }

    const data = await loadFromStorage();
    return data[movieId]?.status || null;
  } catch (error) {
    console.error("Erro ao carregar status do filme:", error);
    return null;
  }
};

// Função para obter filmes com ordenação
const getMoviesSorted = async (movies, sortOrder = 'recent') => {
  switch (sortOrder) {
    case 'alphabetical':
      return movies.sort((a, b) => a.title.localeCompare(b.title));
    case 'rating':
      return movies.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
    case 'oldest':
      return movies.sort((a, b) => (a.addedAt || 0) - (b.addedAt || 0));
    case 'recent':
    default:
      return movies.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  }
};

// Função para obter filmes assistidos
export const getWatchedMovies = async (sortOrder = 'recent') => {
  try {
    const statuses = await loadFromStorage();
    const watchedMovies = Object.values(statuses)
      .filter(movie => movie.status === "watched");
    
    return await getMoviesSorted(watchedMovies, sortOrder);
  } catch (error) {
    console.error("Erro ao carregar filmes assistidos:", error);
    return [];
  }
};

// Função para obter filmes que quer assistir
export const getWantToWatchMovies = async (sortOrder = 'recent') => {
  try {
    const statuses = await loadFromStorage();
    const wantToWatchMovies = Object.values(statuses)
      .filter(movie => movie.status === "wantToWatch");
    
    return await getMoviesSorted(wantToWatchMovies, sortOrder);
  } catch (error) {
    console.error("Erro ao carregar lista de filmes para assistir:", error);
    return [];
  }
};

// Função para obter estatísticas avançadas
export const getMovieStats = async () => {
  try {
    const statuses = await loadFromStorage();
    const movies = Object.values(statuses);
    
    const watched = movies.filter(m => m.status === "watched");
    const wantToWatch = movies.filter(m => m.status === "wantToWatch");
    
    // Estatísticas por gênero (se disponível)
    const genreStats = {};
    movies.forEach(movie => {
      if (movie.genre_ids && Array.isArray(movie.genre_ids)) {
        movie.genre_ids.forEach(genreId => {
          genreStats[genreId] = (genreStats[genreId] || 0) + 1;
        });
      }
    });
    
    // Filme com melhor avaliação
    const topRatedMovie = movies.reduce((max, movie) => 
      (movie.vote_average || 0) > (max.vote_average || 0) ? movie : max, 
      { vote_average: 0 }
    );
    
    // Estatísticas de tempo
    const now = Date.now();
    const lastWeek = now - (7 * 24 * 60 * 60 * 1000);
    const lastMonth = now - (30 * 24 * 60 * 60 * 1000);
    
    const addedThisWeek = movies.filter(m => (m.addedAt || 0) > lastWeek).length;
    const addedThisMonth = movies.filter(m => (m.addedAt || 0) > lastMonth).length;
    
    return {
      total: movies.length,
      watched: watched.length,
      wantToWatch: wantToWatch.length,
      watchedPercentage: movies.length > 0 ? Math.round((watched.length / movies.length) * 100) : 0,
      topRatedMovie: topRatedMovie.vote_average > 0 ? topRatedMovie : null,
      genreStats,
      addedThisWeek,
      addedThisMonth,
      averageRating: movies.length > 0 ? 
        movies.reduce((sum, m) => sum + (m.vote_average || 0), 0) / movies.length : 0,
      lastUpdated: Math.max(...movies.map(m => m.updatedAt || 0)),
      oldestMovie: movies.reduce((oldest, movie) => 
        (movie.addedAt || Infinity) < (oldest.addedAt || Infinity) ? movie : oldest, {}),
      newestMovie: movies.reduce((newest, movie) => 
        (movie.addedAt || 0) > (newest.addedAt || 0) ? movie : newest, {}),
    };
  } catch (error) {
    console.error("Erro ao carregar estatísticas:", error);
    return {
      total: 0,
      watched: 0,
      wantToWatch: 0,
      watchedPercentage: 0,
      topRatedMovie: null,
      genreStats: {},
      addedThisWeek: 0,
      addedThisMonth: 0,
      averageRating: 0,
      lastUpdated: 0,
      oldestMovie: null,
      newestMovie: null,
    };
  }
};

// Função para buscar filmes por título (busca local)
export const searchLocalMovies = async (query, filters = {}) => {
  try {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const statuses = await loadFromStorage();
    const movies = Object.values(statuses);
    const searchTerm = query.toLowerCase().trim();
    
    let filteredMovies = movies.filter(movie => 
      movie.title.toLowerCase().includes(searchTerm) ||
      (movie.overview && movie.overview.toLowerCase().includes(searchTerm))
    );
    
    // Aplica filtros adicionais
    if (filters.status) {
      filteredMovies = filteredMovies.filter(m => m.status === filters.status);
    }
    
    if (filters.minRating) {
      filteredMovies = filteredMovies.filter(m => (m.vote_average || 0) >= filters.minRating);
    }
    
    if (filters.year) {
      filteredMovies = filteredMovies.filter(m => {
        if (!m.release_date) return false;
        return new Date(m.release_date).getFullYear() === filters.year;
      });
    }
    
    return await getMoviesSorted(filteredMovies, filters.sortOrder || 'recent');
  } catch (error) {
    console.error("Erro na busca local:", error);
    return [];
  }
};

// Função para obter filmes por gênero
export const getMoviesByGenre = async (genreId) => {
  try {
    const statuses = await loadFromStorage();
    const movies = Object.values(statuses);
    
    return movies.filter(movie => 
      movie.genre_ids && movie.genre_ids.includes(genreId)
    ).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  } catch (error) {
    console.error("Erro ao buscar filmes por gênero:", error);
    return [];
  }
};

// Função para exportar dados (backup manual)
export const exportMovieData = async () => {
  try {
    const data = await loadFromStorage();
    const stats = await getMovieStats();
    const settings = await loadSettings();
    
    return {
      movies: data,
      stats,
      settings,
      exportedAt: Date.now(),
      version: "1.0",
      appVersion: "1.0.0", // Versão do seu app
    };
  } catch (error) {
    console.error("Erro ao exportar dados:", error);
    throw error;
  }
};

// Função para importar dados (restore manual)
export const importMovieData = async (importData) => {
  try {
    if (!importData || !importData.movies) {
      throw new Error("Dados de importação inválidos");
    }

    // Valida dados antes de importar
    const validMovies = {};
    Object.entries(importData.movies).forEach(([id, movie]) => {
      if (validateMovieData(movie)) {
        validMovies[id] = {
          ...movie,
          updatedAt: movie.updatedAt || Date.now(),
          addedAt: movie.addedAt || Date.now(),
        };
      }
    });

    // Importa configurações se disponíveis
    if (importData.settings) {
      await saveSettings({ ...DEFAULT_SETTINGS, ...importData.settings });
    }

    await saveToStorage(validMovies);
    return Object.keys(validMovies).length;
  } catch (error) {
    console.error("Erro ao importar dados:", error);
    throw error;
  }
};

// Função para limpar filmes antigos (limpeza automática)
export const cleanupOldMovies = async (daysOld = 365) => {
  try {
    const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
    const data = await loadFromStorage();
    
    const cleanedData = {};
    let removedCount = 0;
    
    Object.entries(data).forEach(([id, movie]) => {
      if ((movie.updatedAt || 0) > cutoffTime) {
        cleanedData[id] = movie;
      } else {
        removedCount++;
      }
    });
    
    if (removedCount > 0) {
      await saveToStorage(cleanedData);
    }
    
    return removedCount;
  } catch (error) {
    console.error("Erro na limpeza de filmes antigos:", error);
    return 0;
  }
};

// Função para obter informações de backup
export const getBackupInfo = async () => {
  try {
    const backupData = await AsyncStorage.getItem(BACKUP_KEY);
    if (!backupData) {
      return null;
    }
    
    const backup = JSON.parse(backupData);
    return {
      timestamp: backup.timestamp,
      movieCount: backup.movieCount,
      version: backup.version,
      ageInDays: Math.floor((Date.now() - backup.timestamp) / (24 * 60 * 60 * 1000)),
    };
  } catch (error) {
    console.error("Erro ao obter info do backup:", error);
    return null;
  }
};

// Função para limpar cache (útil para debugging)
export const clearCache = () => {
  memoryCache = null;
  cacheTimestamp = null;
};

// Função para limpar todos os dados
export const clearAllData = async () => {
  try {
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEY),
      AsyncStorage.removeItem(BACKUP_KEY),
      AsyncStorage.removeItem(SETTINGS_KEY),
    ]);
    clearCache();
    return true;
  } catch (error) {
    console.error("Erro ao limpar dados:", error);
    return false;
  }
};

// Função para migrar dados antigos (se necessário)
export const migrateData = async () => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (!data) return false;

    const parsed = JSON.parse(data);
    let needsMigration = false;
    const migratedData = {};
    
    // Verifica se precisa de migração
    Object.keys(parsed).forEach(id => {
      const movieData = parsed[id];
      
      // Se o valor é apenas uma string (formato antigo), pula este item
      if (typeof movieData === 'string') {
        console.warn(`Removendo entrada inválida para o filme ${id}: ${movieData}`);
        needsMigration = true;
        return; // Pula este item
      }
      
      // Se não é um objeto válido, pula
      if (!movieData || typeof movieData !== 'object') {
        console.warn(`Removendo entrada inválida para o filme ${id}`);
        needsMigration = true;
        return;
      }
      
      // Cria uma cópia do objeto para migração
      const movie = { ...movieData };
      
      // Verifica se tem os campos obrigatórios
      if (!movie.id || !movie.title || !movie.status) {
        console.warn(`Removendo filme incompleto ${id}:`, movie);
        needsMigration = true;
        return;
      }
      
      // Adiciona timestamps se não existirem
      if (!movie.updatedAt) {
        movie.updatedAt = Date.now();
        needsMigration = true;
      }
      
      if (!movie.addedAt) {
        movie.addedAt = movie.updatedAt;
        needsMigration = true;
      }
      
      // Garante que o status é válido
      if (!['watched', 'wantToWatch'].includes(movie.status)) {
        console.warn(`Status inválido para filme ${id}: ${movie.status}`);
        needsMigration = true;
        return;
      }
      
      // Remove campos desnecessários que podem existir
      const fieldsToRemove = ['backdrop_path', 'adult', 'video', 'popularity', 'original_language', 'original_title'];
      fieldsToRemove.forEach(field => {
        if (movie.hasOwnProperty(field)) {
          delete movie[field];
          needsMigration = true;
        }
      });
      
      // Limita o tamanho da overview se muito longa
      if (movie.overview && movie.overview.length > 200) {
        movie.overview = movie.overview.substring(0, 200);
        needsMigration = true;
      }
      
      // Adiciona o filme migrado
      migratedData[id] = movie;
    });

    if (needsMigration) {
      console.log(`Migrando ${Object.keys(migratedData).length} filmes de ${Object.keys(parsed).length} entradas originais`);
      await saveToStorage(migratedData);
      console.log("Migração de dados concluída com sucesso");
      return true;
    }

    return false;
  } catch (error) {
    console.error("Erro na migração de dados:", error);
    
    // Em caso de erro crítico, tenta limpar dados corrompidos
    try {
      console.warn("Tentando recuperação de emergência...");
      await AsyncStorage.removeItem(STORAGE_KEY);
      clearCache();
      console.log("Dados corrompidos removidos. Storage reinicializado.");
      return true;
    } catch (recoveryError) {
      console.error("Erro na recuperação de emergência:", recoveryError);
      return false;
    }
  }
};

// Funções para configurações do app
export const getAppSettings = loadSettings;
export const saveAppSettings = saveSettings;

// Função de inicialização do storage melhorada (chame no App.js)
export const initializeStorage = async () => {
  try {
    console.log("🚀 Inicializando storage...");
    
    // Primeiro, faz diagnóstico
    const diagnosis = await diagnoseStorage();
    
    if (diagnosis.status === 'issues_found') {
      console.log("🔧 Problemas detectados, executando reparo automático...");
      await repairStorage();
    }
    
    // Executa migração se necessário
    const migrated = await migrateData();
    if (migrated) {
      console.log("✅ Migração executada com sucesso");
    }
    
    // Carrega configurações iniciais
    const settings = await loadSettings();
    
    // Limpeza automática se habilitada
    if (settings.autoCleanup !== false) {
      const cleanedCount = await cleanupOldMovies(settings.cleanupDays || 365);
      if (cleanedCount > 0) {
        console.log(`🧹 Limpeza automática: ${cleanedCount} filmes antigos removidos`);
      }
    }
    
    console.log("✅ Storage inicializado com sucesso");
    return true;
  } catch (error) {
    console.error("❌ Erro na inicialização do storage:", error);
    
    // Última tentativa: reset completo em caso de erro crítico
    try {
      console.warn("🆘 Tentando reset de emergência...");
      await clearAllData();
      console.log("✅ Reset de emergência concluído");
      return true;
    } catch (resetError) {
      console.error("❌ Falha no reset de emergência:", resetError);
      return false;
    }
  }
};

// Função de diagnóstico para debug (adicionar antes da inicialização)
export const diagnoseStorage = async () => {
  try {
    console.log("🔍 Iniciando diagnóstico do storage...");
    
    const rawData = await AsyncStorage.getItem(STORAGE_KEY);
    if (!rawData) {
      console.log("✅ Storage vazio - primeira execução");
      return { status: 'empty', issues: [] };
    }
    
    const parsed = JSON.parse(rawData);
    const issues = [];
    const validEntries = [];
    const invalidEntries = [];
    
    console.log(`📊 Analisando ${Object.keys(parsed).length} entradas...`);
    
    Object.entries(parsed).forEach(([id, movieData]) => {
      if (typeof movieData === 'string') {
        issues.push(`ID ${id}: Valor é string "${movieData}" em vez de objeto`);
        invalidEntries.push({ id, data: movieData, reason: 'string_value' });
      } else if (!movieData || typeof movieData !== 'object') {
        issues.push(`ID ${id}: Valor não é objeto válido`);
        invalidEntries.push({ id, data: movieData, reason: 'not_object' });
      } else if (!validateMovieData(movieData)) {
        issues.push(`ID ${id}: Objeto não passa na validação`);
        invalidEntries.push({ id, data: movieData, reason: 'validation_failed' });
      } else {
        validEntries.push({ id, data: movieData });
      }
    });
    
    console.log(`✅ Entradas válidas: ${validEntries.length}`);
    console.log(`❌ Entradas inválidas: ${invalidEntries.length}`);
    
    if (issues.length > 0) {
      console.log("🚨 Problemas encontrados:");
      issues.forEach(issue => console.log(`  - ${issue}`));
    }
    
    return {
      status: issues.length > 0 ? 'issues_found' : 'healthy',
      totalEntries: Object.keys(parsed).length,
      validEntries: validEntries.length,
      invalidEntries: invalidEntries.length,
      issues,
      invalidData: invalidEntries,
    };
  } catch (error) {
    console.error("❌ Erro no diagnóstico:", error);
    return {
      status: 'error',
      error: error.message,
      issues: ['Erro ao ler dados do storage']
    };
  }
};

// Função para reparar storage corrompido
export const repairStorage = async () => {
  try {
    console.log("🔧 Iniciando reparo do storage...");
    
    const diagnosis = await diagnoseStorage();
    if (diagnosis.status === 'healthy' || diagnosis.status === 'empty') {
      console.log("✅ Storage está saudável, nenhum reparo necessário");
      return { repaired: 0, removed: 0 };
    }
    
    const rawData = await AsyncStorage.getItem(STORAGE_KEY);
    const parsed = JSON.parse(rawData);
    const repairedData = {};
    let repairedCount = 0;
    let removedCount = 0;
    
    Object.entries(parsed).forEach(([id, movieData]) => {
      if (typeof movieData === 'object' && movieData !== null) {
        // Tenta reparar objeto incompleto
        if (movieData.id && movieData.title) {
          const repaired = {
            ...movieData,
            id: parseInt(movieData.id),
            title: String(movieData.title),
            status: movieData.status || 'wantToWatch',
            updatedAt: movieData.updatedAt || Date.now(),
            addedAt: movieData.addedAt || Date.now(),
          };
          
          if (validateMovieData(repaired)) {
            repairedData[id] = repaired;
            repairedCount++;
          } else {
            console.warn(`Não foi possível reparar entrada ${id}`);
            removedCount++;
          }
        } else {
          console.warn(`Removendo entrada incompleta ${id}`);
          removedCount++;
        }
      } else {
        console.warn(`Removendo entrada inválida ${id}: ${movieData}`);
        removedCount++;
      }
    });
    
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(repairedData));
    clearCache();
    
    console.log(`✅ Reparo concluído: ${repairedCount} reparados, ${removedCount} removidos`);
    return { repaired: repairedCount, removed: removedCount };
  } catch (error) {
    console.error("❌ Erro durante reparo:", error);
    throw error;
  }
};