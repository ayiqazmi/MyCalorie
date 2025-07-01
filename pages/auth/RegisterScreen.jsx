import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Dimensions,
  ImageBackground,
  Image,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
  signOut,
  getAuth,
} from "firebase/auth";
import { doc, setDoc, getFirestore } from "firebase/firestore";
import { auth } from "../../config/firebase-config";

const { width } = Dimensions.get("window");
const db = getFirestore();

export default function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])(?=.*[A-Z]).{8,}$/;

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
        displayName: username,
      });

      await sendEmailVerification(user);

      await setDoc(doc(db, "users", user.uid), {
        email,
        username,
        createdAt: new Date(),
        emailVerified: false,
        role: "user",
      });

      Alert.alert(
        "Verify Your Email",
        "A verification link has been sent to your email. Please verify before logging in."
      );

      await signOut(auth);
    } catch (error) {
      console.log("Firebase Auth Error:", error);
      Alert.alert("Error", error.message);
    }
  };

  useEffect(() => {
    try {
      const auth = getAuth();
      console.log("Connected to Firebase Auth:", auth);
    } catch (error) {
      console.log("Firebase error:", error.message);
    }
  }, []);

  return (
    <ImageBackground
      source={require("../../assets/background.png")}
      style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      resizeMode="cover"
    >
      <View style={styles.card}>
        <Image source={require("../../assets/MyCalorie.png")} style={styles.logo} />
        <Text style={styles.brandText}>MyCalorie</Text>

        <View style={styles.inputBox}>
          <TextInput
            placeholder="Email"
            placeholderTextColor="#fff"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputBox}>
          <TextInput
            placeholder="Username"
            placeholderTextColor="#fff"
            value={username}
            onChangeText={setUsername}
            style={styles.input}
          />
        </View>

        <View style={styles.inputBox}>
          <View style={styles.passwordRow}>
            <TextInput
              placeholder="Password"
              placeholderTextColor="#fff"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              style={[styles.input, { flex: 1 }]}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Feather
                name={showPassword ? "eye-off" : "eye"}
                size={20}
                color="#fff"
                style={{ paddingHorizontal: 8 }}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputBox}>
          <View style={styles.passwordRow}>
            <TextInput
              placeholder="Confirm Password"
              placeholderTextColor="#fff"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPassword}
              style={[styles.input, { flex: 1 }]}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Feather
                name={showPassword ? "eye-off" : "eye"}
                size={20}
                color="#fff"
                style={{ paddingHorizontal: 8 }}
              />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity onPress={handleRegister} style={styles.registerButton}>
          <Text style={styles.registerText}>REGISTER</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("Login")}>
          <Text style={styles.switchText}>
            Already have an account? <Text style={{ fontWeight: "bold" }}>LOGIN</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "white",
    width: width * 0.85,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    elevation: 8,
  },
  logo: {
    width: 80,
    height: 80,
    resizeMode: "contain",
    marginBottom: 4,
  },
  brandText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#7C3AED",
    marginBottom: 24,
  },
  inputBox: {
    width: "100%",
    backgroundColor: "#B388FF",
    borderRadius: 30,
    paddingHorizontal: 16,
    marginVertical: 8,
  },
  input: {
    height: 50,
    color: "#fff",
  },
  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  registerButton: {
    backgroundColor: "#8E24AA",
    paddingVertical: 14,
    paddingHorizontal: 60,
    borderRadius: 30,
    marginTop: 10,
  },
  registerText: {
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
  },
  switchText: {
    marginTop: 20,
    color: "#6A1B9A",
    fontSize: 14,
  },
});
