// App.js
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useFonts } from 'expo-font';
import AppLoading from 'expo-app-loading';
import { Feather, Ionicons } from '@expo/vector-icons';
import { View, ActivityIndicator, Linking, Alert } from 'react-native';
import * as LinkingExpo from 'expo-linking';
import { getInitialState } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { BaseToast } from 'react-native-toast-message';


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
import ResetPasswordScreen from './pages/ResetPasswordScreen';
import CustomSplashScreen from './pages/CustomSplashScreen';

import { navigationRef } from './utils/navigationRef';
import RejectedMealsScreen from './pages/admin/RejectedMealsScreen';
import PendingMealsScreen from './pages/admin/PendingMealsScreen';
import AdminDashboardScreen from './pages/admin/AdminDashboardScreen';
import UserListScreen from './pages/admin/UserListScreen';
import UserDetailScreen from './pages/admin/UserDetailScreen';
import AdminMealPlanScreen from './pages/admin/AdminMealPlanScreen';
import AdminProfileScreen from './pages/admin/AdminProfileScreen';
import GiveFeedbackScreen from './pages/admin/GiveFeedbackScreen';
import AdminAdjustMealPlanScreen from './pages/admin/AdminAdjustMealPlanScreen';

import { auth } from './config/firebase-config';
import { onAuthStateChanged, applyActionCode } from 'firebase/auth';
import linking from './utils/LinkingConfiguration';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './config/firebase-config';

const Stack = createNativeStackNavigator();

export default function App() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
const [navIsReady, setNavIsReady] = useState(false);

  const [fontsLoaded] = useFonts({
    ...Feather.font,
    ...Ionicons.font,
  });

  // Splash timer (2s)
  useEffect(() => {
    const timeout = setTimeout(() => {
      setShowSplash(false);
    }, 2000); // 2 seconds splash

    return () => clearTimeout(timeout);
  }, []);

  // Auth state handling
  useEffect(() => {
    if (showSplash) return; // Delay auth until splash done

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("🔥 Firebase user:", firebaseUser?.email || 'not logged in');
      setUser(firebaseUser);

      if (firebaseUser) {
        const token = await firebaseUser.getIdTokenResult();
        const isAdminClaim = token?.claims?.isAdmin;

        let isAdminFinal = false;
        if (typeof isAdminClaim === 'boolean') {
          isAdminFinal = isAdminClaim;
        } else {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          isAdminFinal = userDoc.exists() && userDoc.data().isAdmin === true;
        }

        setIsAdmin(isAdminFinal);
      }

      setLoadingUser(false);
    });

    return () => unsubscribe();
  }, [showSplash]);

useEffect(() => {
  const handleInitialDeepLink = async () => {
    const url = await Linking.getInitialURL();
    if (!url) return;

    const params = new URLSearchParams(url.split('?')[1]);
    const oobCode = params.get('oobCode');
    const mode = params.get('mode');

    if (mode === 'resetPassword' && oobCode) {
      console.log('🔗 Navigating to ResetPasswordScreen with oobCode:', oobCode);
      if (navIsReady) {
        navigationRef.current?.navigate('ResetPassword', { oobCode });
      } else {
        const interval = setInterval(() => {
          if (navigationRef.current && navIsReady) {
            navigationRef.current.navigate('ResetPassword', { oobCode });
            clearInterval(interval);
          }
        }, 100);
      }
    }

    if (mode === 'verifyEmail' && oobCode) {
      try {
        await applyActionCode(auth, oobCode);
        Alert.alert('✅ Email Verified', 'Your email has been successfully verified.');
      } catch (error) {
        Alert.alert('❌ Verification Failed', error.message);
      }
    }
  };

  if (!showSplash && !loadingUser) {
    handleInitialDeepLink();
  }
}, [showSplash, loadingUser, navIsReady]);



  // Show splash screen
  if (showSplash || !fontsLoaded) {
    return <CustomSplashScreen onFinish={() => setShowSplash(false)} />;
  }

  // Show loading while checking auth
  if (loadingUser) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  const getInitialRoute = () => {
    if (!user) return 'Login';
    return isAdmin ? 'AdminDashboard' : 'Home';
  };

  return (
    <NavigationContainer
  linking={linking}
  ref={navigationRef}
  onReady={() => setNavIsReady(true)} // ✅ flag that navigator is ready
>
<Toast
  config={{
    success: (props) => (
      <BaseToast
        {...props}
        style={{ borderLeftColor: '#6C63FF' }}
        contentContainerStyle={{ paddingHorizontal: 15 }}
        text1Style={{
          fontSize: 15,
          fontWeight: 'bold',
        }}
        text2Style={{
          fontSize: 13,
          color: '#333',
        }}
      />
    ),
  }}
/>


      <Stack.Navigator initialRouteName={getInitialRoute()}>
        {user ? (
          <>
            {isAdmin ? (
              <>
                <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
                <Stack.Screen name="UserList" component={UserListScreen} />
                <Stack.Screen name="UserDetail" component={UserDetailScreen} />
                <Stack.Screen name="AdminMealPlan" component={AdminMealPlanScreen} />
                <Stack.Screen name="AdminProfile" component={AdminProfileScreen} />
                <Stack.Screen name="PendingMeals" component={PendingMealsScreen} />
                <Stack.Screen name="RejectedMeals" component={RejectedMealsScreen} />
                <Stack.Screen name="GiveFeedback" component={GiveFeedbackScreen} />
                <Stack.Screen name="AdminAdjustMealPlan" component={AdminAdjustMealPlanScreen} />
              </>
            ) : (
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
                <Stack.Screen name="CachedFoodsScreen" component={CachedFoodsScreen} />
                <Stack.Screen name="AdjustMealPlan" component={AdjustMealPlanScreen} />
              </>
            )}
            <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
            <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
