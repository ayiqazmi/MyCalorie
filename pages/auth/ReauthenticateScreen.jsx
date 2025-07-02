import React, { useState } from 'react';
import {
  View, Text, TextInput, Alert, StyleSheet, TouchableOpacity, ImageBackground, Dimensions
} from 'react-native';
import {
  getAuth,
  EmailAuthProvider,
  reauthenticateWithCredential,
  verifyBeforeUpdateEmail
} from 'firebase/auth';
import { setReauthenticated } from "./utils/authState";

const { width } = Dimensions.get('window');

export default function ReauthenticateScreen({ navigation, route }) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const newEmail = route.params?.emailToUpdate || null;

  const handleReauthenticate = async () => {
    setLoading(true);
    try {
      const user = getAuth().currentUser;
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);

      if (newEmail) {
        await verifyBeforeUpdateEmail(user, newEmail);
        Alert.alert("Email Change Requested", "Check your new email inbox for the verification link.");
      }

      Alert.alert("Success", "Re-authenticated successfully.");
      setReauthenticated(true);
      navigation.goBack();
    } catch (error) {
      console.error("Re-authentication error:", error);
      if (error.code === "auth/invalid-credential") {
        Alert.alert("Incorrect Password", "The password you entered is incorrect. Please try again.");
      } else {
        Alert.alert("Error", error.message);
      }
    }
    setLoading(false);
  };

  return (
    <ImageBackground
      source={require('../../assets/background.png')}
      style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
      resizeMode="cover"
    >
      <View style={styles.card}>
        <Text style={styles.title}>Re-authenticate</Text>
        <Text style={styles.subtitle}>Enter your password to continue</Text>

        <View style={styles.inputBox}>
          <TextInput
            placeholder="Password"
            placeholderTextColor="#888"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
            style={styles.input}
          />
        </View>

        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Text style={styles.toggleText}>
            {showPassword ? 'Hide Password' : 'Show Password'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, loading && { backgroundColor: '#ccc' }]}
          onPress={handleReauthenticate}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Please wait...' : 'Confirm'}
          </Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    width: width * 0.85,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    elevation: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#7C3AED',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#444',
    textAlign: 'center',
    marginBottom: 20,
  },
  inputBox: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 30,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#ccc',
    marginVertical: 8,
  },
  input: {
    height: 50,
    color: '#000',
  },
  toggleText: {
    color: '#6A1B9A',
    fontWeight: 'bold',
    textAlign: 'right',
    width: '100%',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#8E24AA',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 30,
    marginTop: 10,
    width: '100%',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
