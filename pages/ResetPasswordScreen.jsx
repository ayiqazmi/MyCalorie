import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet, TouchableOpacity } from 'react-native';
import { verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth';
import { auth } from '../config/firebase-config';
import { useNavigation, useRoute } from '@react-navigation/native';

export default function ResetPasswordScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { oobCode } = route.params || {};

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
    <View style={styles.container}>
      <Text style={styles.title}>Reset Password</Text>

      <TextInput
        placeholder="New Password"
        secureTextEntry={!showPassword}
        style={styles.input}
        value={newPassword}
        onChangeText={setNewPassword}
      />
      <TouchableOpacity onPress={() => setShowPassword((prev) => !prev)}>
        <Text style={styles.toggleText}>
          {showPassword ? 'Hide Password' : 'Show Password'}
        </Text>
      </TouchableOpacity>

      <TextInput
        placeholder="Confirm New Password"
        secureTextEntry={!showConfirmPassword}
        style={styles.input}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />
      <TouchableOpacity onPress={() => setShowConfirmPassword((prev) => !prev)}>
        <Text style={styles.toggleText}>
          {showConfirmPassword ? 'Hide Confirm Password' : 'Show Confirm Password'}
        </Text>
      </TouchableOpacity>

      <Button title="Reset Password" onPress={handleResetPassword} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#fff' },
  title: { fontSize: 24, marginBottom: 20, textAlign: 'center', fontWeight: 'bold' },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 12, borderRadius: 6, marginBottom: 8 },
  toggleText: { color: '#007BFF', textAlign: 'right', marginBottom: 12 },
});
