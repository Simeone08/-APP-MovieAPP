import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, Platform } from 'react-native';

// Importar as telas
import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
// Icons (você pode usar react-native-vector-icons ou emojis)
const TabIcon = ({ focused, icon, label }) => (
  <View style={styles.tabIconContainer}>
    <Text style={[
      styles.tabIcon, 
      { color: focused ? '#E50914' : '#666666' }
    ]}>
      {icon}
    </Text>
    <Text style={[
      styles.tabLabel, 
      { color: focused ? '#E50914' : '#666666' }
    ]}>
      {label}
    </Text>
  </View>
);

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#E50914',
        tabBarInactiveTintColor: '#666666',
        tabBarShowLabel: false,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon 
              focused={focused} 
              icon="🏠" 
              label="Início" 
            />
          ),
          tabBarAccessibilityLabel: 'Tela inicial com filmes populares',
        }}
      />
      
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon 
              focused={focused} 
              icon="🔍" 
              label="Buscar" 
            />
          ),
          tabBarAccessibilityLabel: 'Buscar filmes',
        }}
      />
      
      <Tab.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon 
              focused={focused} 
              icon="❤️" 
              label="Favoritos" 
            />
          ),
          tabBarAccessibilityLabel: 'Filmes favoritos',
          tabBarBadge: null, // Pode adicionar badge com número de favoritos
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#1a1a1a',
    borderTopColor: '#333333',
    borderTopWidth: 1,
    height: Platform.OS === 'ios' ? 85 : 65,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 25 : 8,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  
  tabIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  
  tabLabel: {
    fontSize: 8,
    fontWeight: '600',
    textAlign: 'center',
  },
});