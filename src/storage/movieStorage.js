import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "movies_status";

export const saveMovieStatus = async (movieId, status) => {
  // status: "watched" ou "wantToWatch"
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    const parsed = data ? JSON.parse(data) : {};
    parsed[movieId] = status;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
  } catch (error) {
    console.log("Erro ao salvar status", error);
  }
};

export const getMovieStatus = async () => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.log("Erro ao carregar status", error);
    return {};
  }
};
