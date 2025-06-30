import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../config/firebase-config';
import { useNavigation } from '@react-navigation/native';

export default function LoginScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    if (!user.emailVerified) {
      Alert.alert(
        'Email Not Verified',
        'Please check your inbox and verify your email before logging in.'
      );
      return;
    }

    navigation.replace("Home");
  } catch (error) {
    console.log(error);
    let message = 'Login failed. Please try again.';
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
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

      <TouchableOpacity onPress={() => setShowPassword(prev => !prev)}>
        <Text style={styles.toggleText}>
          {showPassword ? 'Hide Password' : 'Show Password'}
        </Text>
      </TouchableOpacity>

      <Button title="Login" onPress={handleLogin} />

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
