import React, { useState, useEffect } from 'react';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { auth } from '../../config/firebase-config'; // Make sure Firebase is configured properly
import { View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native';



export default function LoginScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  

  const [request, response, promptAsync] = Google.useAuthRequest({
  expoClientId: '878588687981-tulnlcn1kujcn12amphedl5sajo92u2l.apps.googleusercontent.com',
  androidClientId: '878588687981-54uj52ops3kb95oqidpnfgt3cck9h35a.apps.googleusercontent.com',
  iosClientId: '878588687981-0spq19dmkg29fhuolmc9hb7q2unkj9j6.apps.googleusercontent.com',
    redirectUri: makeRedirectUri({ scheme: 'mycalorie', useProxy: true }) // 👈 match your app.json scheme
    //redirectUri: 'https://auth.expo.io/@ayiqazmi/MyCalorie'
});

WebBrowser.maybeCompleteAuthSession();

useEffect(() => {
  if (response?.type === 'success') {
    const { id_token } = response.params;
    const credential = GoogleAuthProvider.credential(id_token);
    signInWithCredential(auth, credential)
      .then(() => navigation.replace("Home"))
      .catch((err) => Alert.alert("Firebase Error", err.message));
  } else if (response?.type === 'dismiss') {
    console.log('User cancelled the login or closed the window');
  } else if (response?.type === 'error') {
    console.log('OAuth Error:', response);
  }
}, [response]);



const handleLogin = async () => {
  if (!email || !password) {
    Alert.alert('Missing Fields', 'Please enter both email and password.');
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    Alert.alert("Invalid Email", "Please enter a valid email address.");
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, email, password);
    navigation.replace("Home");
  } catch (error) {
    console.log(error); // optional: log full error for debugging

    let message = 'Login failed. Please try again.';
    
    // Generic error message for invalid credentials
    if (
      error.code === 'auth/user-not-found' ||
      error.code === 'auth/wrong-password'
    ) {
      message = 'Incorrect email or password.';
    }

    Alert.alert('Login Error', message);
  }
};


  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        style={styles.input}
        secureTextEntry={!showPassword}
      />
      <TouchableOpacity onPress={() => setShowPassword((prev) => !prev)}>
        <Text style={styles.toggleText}>
          {showPassword ? 'Hide Password' : 'Show Password'}
        </Text>
      </TouchableOpacity>

      <Button title="Login" onPress={handleLogin} />
      <Button
        title="Sign in with Google"
        disabled={!request}
        onPress={() => promptAsync({ useProxy: true })}
      />

      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={styles.switchText}>
          Don't have an account? Register here
        </Text>
      </TouchableOpacity>
      
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#fff' },
  title: { fontSize: 28, marginBottom: 24, textAlign: 'center', fontWeight: 'bold' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 12, marginBottom: 12 },
  toggleText: { color: '#007BFF', textAlign: 'right', marginBottom: 16 },
  switchText: { marginTop: 20, color: '#007BFF', textAlign: 'center' },
});
