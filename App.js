// App.js
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useFonts } from 'expo-font';
import AppLoading from 'expo-app-loading';
import { Feather, Ionicons } from '@expo/vector-icons';
import { View, ActivityIndicator } from 'react-native';

import LoginScreen from './pages/auth/LoginScreen';
import RegisterScreen from './pages/auth/RegisterScreen';
import HomeScreen from './pages/HomeScreen';
import ProfileScreen from './pages/ProfileScreen';
import EditProfile from './pages/EditProfile';
import ReauthenticateScreen from './pages/auth/ReauthenticateScreen';
import HealthDetails from './pages/HealthDetails';
import AddMealScreen from './pages/AddMealScreen';
import MealPlanScreen from './pages/MealPlanScreen';
import RecipeScreen from './pages/RecipeScreen';
import RecipeListScreen from './pages/RecipeListScreen';
import CachedFoodsScreen from './pages/CachedFoodsScreen';
import AdjustMealPlanScreen from './pages/AdjustMealPlanScreen';

import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './config/firebase-config.js';
// import { ThemeProvider } from "./ThemeContext";

console.log("📦 Screen Components:", {
  RecipeScreen,
  CachedFoodsScreen,
  AdjustMealPlanScreen,
  MealPlanScreen,
});


const Stack = createNativeStackNavigator();

export default function App() {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [fontsLoaded] = useFonts({
    ...Feather.font,
    ...Ionicons.font,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("🔥 Firebase user:", user?.email || 'not logged in');
      setUser(user);
      setLoadingUser(false);
    });
    return () => unsubscribe();
  }, []);

  if (!fontsLoaded || loadingUser) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={user ? "Home" : "Login"}>
        {user ? (
          <>
            <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="EditProfile" component={EditProfile} />
            <Stack.Screen name="Reauthenticate" component={ReauthenticateScreen} />
            <Stack.Screen name="HealthDetails" component={HealthDetails} />
            <Stack.Screen name="AddMeal" component={AddMealScreen} />
            <Stack.Screen name="MealPlan" component={MealPlanScreen} />
            <Stack.Screen name="Recipe" component={RecipeScreen} />
            <Stack.Screen name="RecipeList" component={RecipeListScreen} />
            <Stack.Screen name="CachedFoodsScreen" component={CachedFoodsScreen} options={{ title: 'Cached Foods' }} />
            <Stack.Screen name="AdjustMealPlan" component={AdjustMealPlanScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
