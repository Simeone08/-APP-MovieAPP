import React, { useEffect } from 'react';
import { StatusBar, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import TabNavigator from './src/router/TabNavigator';
import { initializeStorage } from './src/storage/movieStorage';

export default function App() {
  useEffect(() => {
    const init = async () => {
      try {
        await initializeStorage();
        console.log('✅ App inicializado com sucesso');
      } catch (error) {
        console.error('❌ Erro na inicialização:', error);
      }
    };
    
    init();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar 
        barStyle={Platform.OS === 'ios' ? 'light-content' : 'light-content'}
        backgroundColor="#1a1a1a"
        translucent={false}
      />
      <NavigationContainer
        theme={{
          dark: true,
          colors: {
            primary: '#E50914',
            background: '#1a1a1a',
            card: '#2a2a2a',
            text: '#ffffff',
            border: '#444444',
            notification: '#E50914',
          },
        }}
      >
        <TabNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}