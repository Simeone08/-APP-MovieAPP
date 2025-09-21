import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { initializeStorage } from './src/storage/movieStorage';
import HomeScreen from './src/screens/HomeScreen';
import SearchScreen from './src/screens/SearchScreen';

export default function App() {


  useEffect(() => {
  initializeStorage();
}, []);


  return (
    <View style={styles.container}>
      <HomeScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
