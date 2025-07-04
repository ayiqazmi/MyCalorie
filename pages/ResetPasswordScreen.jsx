import React, { useState, useLayoutEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, Alert, TouchableOpacity, Image, ImageBackground, Dimensions
} from 'react-native';
import { verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth';
import { auth } from '../config/firebase-config';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function ResetPasswordScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { oobCode } = route.params || {};

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({ title: 'Reset Password' });
  }, [navigation]);

  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])(?=.*[A-Z]).{8,}$/;

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert("Missing Fields", "Please fill in both password fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Mismatch", "Passwords do not match.");
      return;
    }

    if (!passwordRegex.test(newPassword)) {
      Alert.alert(
        "Weak Password",
        "Password must be at least 8 characters long, include one uppercase letter, one number, and one special character."
      );
      return;
    }

    try {
      await verifyPasswordResetCode(auth, oobCode);
      await confirmPasswordReset(auth, oobCode, newPassword);
      Alert.alert("Success", "Password has been reset.");
      navigation.replace("Login");
    } catch (error) {
      console.log(error);
      Alert.alert("Error", error.message);
    }
  };

  return (
    <ImageBackground
      source={require('../assets/background.png')}
      style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
      resizeMode="cover"
    >
      <View style={styles.card}>
        <Image source={require('../assets/MyCalorie.png')} style={styles.logo} />
        <Text style={styles.brandText}>MyCalorie</Text>
        <Text style={styles.title}>Reset Password</Text>

        {/* New Password Input */}
        <View style={styles.inputBox}>
          <View style={styles.passwordRow}>
            <TextInput
              placeholder="New Password"
              placeholderTextColor="#fff"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!showPassword}
              style={[styles.input, { flex: 1 }]}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Feather
                name={showPassword ? 'eye-off' : 'eye'}
                size={20}
                color="#fff"
                style={{ paddingHorizontal: 8 }}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Confirm Password Input */}
        <View style={styles.inputBox}>
          <View style={styles.passwordRow}>
            <TextInput
              placeholder="Confirm Password"
              placeholderTextColor="#fff"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              style={[styles.input, { flex: 1 }]}
            />
            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
              <Feather
                name={showConfirmPassword ? 'eye-off' : 'eye'}
                size={20}
                color="#fff"
                style={{ paddingHorizontal: 8 }}
              />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity onPress={handleResetPassword} style={styles.resetButton}>
          <Text style={styles.resetText}>RESET PASSWORD</Text>
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
  logo: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
    marginBottom: 4,
  },
  brandText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#7C3AED',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6A1B9A',
    marginBottom: 16,
  },
  inputBox: {
    width: '100%',
    backgroundColor: '#B388FF',
    borderRadius: 30,
    paddingHorizontal: 16,
    marginVertical: 8,
  },
  input: {
    height: 50,
    color: '#fff',
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resetButton: {
    backgroundColor: '#8E24AA',
    paddingVertical: 14,
    paddingHorizontal: 60,
    borderRadius: 30,
    marginTop: 20,
  },
  resetText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
