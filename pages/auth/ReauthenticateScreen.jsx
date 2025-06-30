import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet, TouchableOpacity } from 'react-native';
import { getAuth, EmailAuthProvider, reauthenticateWithCredential, verifyBeforeUpdateEmail } from 'firebase/auth';
import { setReauthenticated } from "./utils/authState"; // Adjust the path as needed


const ReauthenticateScreen = ({ navigation, route, }) => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const newEmail = route.params?.emailToUpdate || null;

  const handleReauthenticate = async () => {
    setLoading(true);
    try {
      const user = getAuth().currentUser;
      console.log("Current user:", user.email);
  
      const credential = EmailAuthProvider.credential(user.email, password);
      console.log("Credential object created:", credential);
  
      await reauthenticateWithCredential(user, credential);
      console.log("Reauth success!");
  
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
    <View style={styles.container}>
      <Text style={styles.title}>Re-authenticate</Text>
      <Text style={styles.subtitle}>Enter your password to continue</Text>
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry={!showPassword}
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
        <Text style={styles.toggleText}>{showPassword ? 'Hide Password' : 'Show Password'}</Text>
      </TouchableOpacity>
      
      <Button title={loading ? "Please wait..." : "Confirm"} onPress={handleReauthenticate} />
    </View>
  );
};

export default ReauthenticateScreen;

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  subtitle: { fontSize: 16, marginBottom: 20 },
  input: { borderWidth: 1, borderColor: '#aaa', padding: 10, marginBottom: 20, borderRadius: 5 },
  toggleText: { color: '#007BFF', textAlign: 'right', marginBottom: 16 },
});
