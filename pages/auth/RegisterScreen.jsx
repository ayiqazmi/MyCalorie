    // pages/auth/RegisterScreen.jsx
    import { useState } from "react";
    import { View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity } from "react-native";
    import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
    import { auth } from "../../config/firebase-config";
    import React, { useEffect } from 'react';
    import { getAuth } from 'firebase/auth';
    import { doc, setDoc, getFirestore} from "firebase/firestore";
    import { db } from "../../config/firebase-config";
    //import { getFirestore} from "firebase/firestore";
    import { updateProfile } from "firebase/auth";


    export default function RegisterScreen({ navigation }) {
    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])(?=.*[A-Z]).{8,}$/;
    const db = getFirestore();

const handleRegister = async () => {
  if (!email || !username || !password || !confirmPassword) {
    Alert.alert("Missing Fields", "All fields are required.");
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    Alert.alert("Invalid Email", "Please enter a valid email address.");
    return;
  }

  if (password !== confirmPassword) {
    Alert.alert("Error", "Passwords do not match");
    return;
  }

if (!passwordRegex.test(password)) {
  Alert.alert(
    "Weak Password",
    "Password must be at least 8 characters long and include:\n• 1 uppercase letter\n• 1 number\n• 1 special character (@$!%*#?&)"
  );
  return;
}


  try {
    const res = await createUserWithEmailAndPassword(auth, email, password);
    const user = res.user;

    await updateProfile(user, {
      displayName: username
    });

    // Send email verification
await sendEmailVerification(user);

await setDoc(doc(db, "users", user.uid), {
  email,
  username,
  createdAt: new Date(),
  emailVerified: false // optional: store this
});

// Alert + redirect to verify screen
Alert.alert(
  "Verify Your Email",
  "A verification link has been sent to your email. Please verify before logging in."
);

    Alert.alert("Success", "Account created!");
    navigation.replace("Home"); // ✅ Optional: navigate to Home after registration
  } catch (error) {
    console.log("Firebase Auth Error:", error);
    Alert.alert("Error", error.message);
  }
};


    useEffect(() => {
        try {
          const auth = getAuth();
          console.log('Connected to Firebase Auth:', auth);
        } catch (error) {
          console.log('Firebase error:', error.message);
        }
      }, []);

    return (
        <View style={styles.container}>
        <Text style={styles.title}>Register</Text>
        <TextInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
        />
        <TextInput
            placeholder="Username"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            keyboardType="default"
            style={styles.input}
        />
        <TextInput
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            style={styles.input}
        />
        <TextInput
            placeholder="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showPassword}
            style={styles.input}
        />
        <TouchableOpacity onPress={() => setShowPassword((prev) => !prev)}>
                <Text style={styles.toggleText}>
                  {showPassword ? 'Hide Password' : 'Show Password'}
                </Text>
        </TouchableOpacity>                            
        <Button title="Register" onPress={handleRegister} />
        <Text style={styles.switchText} onPress={() => navigation.navigate("Login")}>
            Already have an account? Login here
        </Text>
        </View>
    );
    }

    const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        padding: 24,
    },
    title: {
        fontSize: 32,
        marginBottom: 24,
        textAlign: "center",
    },
    input: {    
        height: 50,
        borderWidth: 1,
        borderColor: "#ccc",
        marginBottom: 12,
        paddingHorizontal: 12,
        borderRadius: 8,
    },
    switchText: { marginTop: 20, color: '#007BFF', textAlign: 'center' },
    toggleText: { color: '#007BFF', textAlign: 'right', marginBottom: 16 },
    });
