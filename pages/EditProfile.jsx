import React, { useState, useLayoutEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme, useFocusEffect } from "@react-navigation/native";
//import { Home, Target, ClipboardList, User } from "lucide-react-native";
import { auth, db } from "../config/firebase-config.js";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { verifyBeforeUpdateEmail, updatePassword } from "firebase/auth";
import { getReauthenticated, setReauthenticated } from "./auth/utils/authState"; // Adjust the path as needed
import * as ImagePicker from "expo-image-picker";
import { Image } from "react-native";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";



const EditProfile = ({ navigation, route }) => {
  const { colors } = useTheme();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isReauthenticated, setIsReauthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState("About You");
  const [profileImage, setProfileImage] = useState(null);



  
  useLayoutEffect(() => {
    navigation.setOptions({
      title: "Edit Profile",
      headerTitleAlign: "center",
    });

    const fetchUserData = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const userDocRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUsername(data.username || "");
            setEmail(data.email || "");
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();

  }, [navigation, colors.text]);

  useFocusEffect(
    useCallback(() => {
      if (getReauthenticated()) {
        setIsReauthenticated(true);
        setReauthenticated(false); // Reset flag after use
      }
    }, [])
  );

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });
  
      if (!result.canceled) {
        const uri = result.assets[0].uri;
        setProfileImage(uri); // Shows in UI immediately
  
        const response = await fetch(uri);
        const blob = await response.blob();
  
        const storage = getStorage();
        const user = auth.currentUser;
  
        if (!user) {
          Alert.alert("Error", "No authenticated user found.");
          return;
        }
  
        const storageRef = ref(storage, `profilePictures/${user.uid}.jpg`);
  
        // Upload to Storage
        await uploadBytes(storageRef, blob);
        const downloadURL = await getDownloadURL(storageRef);
  
        // Save URL to Firestore
        const db = getFirestore();
        const userDocRef = doc(db, "users", user.uid);
        await updateDoc(userDocRef, { photoURL: downloadURL });
  
        setProfileImage(downloadURL); // Update UI with uploaded image
  
        Alert.alert("Success", "Profile picture updated.");
      }
    } catch (error) {
      console.error("Image upload error:", error);
      Alert.alert("Error", error.message);
    }
  };
  
  
  const handleSaveUsername = async () => {
    if (!username.trim()) {
      Alert.alert("Validation Error", "Username cannot be empty.");
      return;
    }

    setLoading(true);
    try {
      const userDocRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(userDocRef, { username: username.trim() });
      Alert.alert("Success", "Username updated successfully.");
    } catch (error) {
      console.error("Error updating username:", error);
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

const handleSendEmailChangeLink = async () => {
  if (!email.trim()) {
    Alert.alert("Validation Error", "Email cannot be empty.");
    return;
  }

  setLoading(true);
  try {
    const user = auth.currentUser;
    if (user.email === email.trim()) {
      Alert.alert("No Change", "The email is already the same.");
      setLoading(false);
      return;
    }

    await verifyBeforeUpdateEmail(user, email.trim());
    Alert.alert(
      "Email Change Requested",
      "A verification link has been sent to your new email address. Please check your inbox and click the link to complete the change."
    );
  } catch (error) {
    if (error.code === "auth/requires-recent-login") {
      Alert.alert(
        "Reauthentication Required",
        "Please reauthenticate before changing your email.",
        [
          {
            text: "OK",
            onPress: () => navigation.navigate("Reauthenticate", { emailToUpdate: email.trim() }),
          },
        ]
      );
    } else {
      console.error("Error sending email change link:", error);
      Alert.alert("Error", error.message);
    }
  } finally {
    setLoading(false);
  }
};

const handleSetNewPassword = async () => {
  if (!isReauthenticated) {
    Alert.alert("Reauthentication Required", "Please reauthenticate before changing your password.");
    navigation.navigate("Reauthenticate")
    return;
  }

  if (!password || !confirmPassword) {
    Alert.alert("Validation Error", "Both password fields must be filled.");
    return;
  }

  if (password !== confirmPassword) {
    Alert.alert("Validation Error", "Passwords do not match.");
    return;
  }

  setLoading(true);
  try {
    await updatePassword(auth.currentUser, password);
    Alert.alert("Success", "Your password has been updated successfully.");
    setPassword("");
    setConfirmPassword("");
    setIsReauthenticated(false);
  } catch (error) {
    console.error("Error updating password:", error);
    Alert.alert("Error", error.message);
  } finally {
    setLoading(false);
  }
};

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.tabContainer}>
  <TouchableOpacity
    style={[styles.tab, activeTab === "About You" && styles.activeTab]}
    onPress={() => setActiveTab("About You")}
  >
    <Text style={[styles.tabText, activeTab === "About You" && styles.activeTabText]}>About You</Text>
  </TouchableOpacity>
  <TouchableOpacity
    style={[styles.tab, activeTab === "HealthDetails" && styles.activeTab]}
    onPress={() => navigation.navigate("HealthDetails")}
  >
    <Text style={[styles.tabText, activeTab === "HealthDetails" && styles.activeTabText]}>Health Details</Text>
  </TouchableOpacity>
</View>

<View style={styles.profilePictureContainer}>
  <TouchableOpacity
    style={styles.imageWrapper}
    onPress={pickImage}
  >
    <Image
      source={profileImage ? { uri: profileImage } : require("../assets/profile-placeholder.png")}
      style={styles.profileImage}
    />
    <Text style={styles.addPictureText}>Add Profile Picture</Text>
  </TouchableOpacity>
</View>


        <View style={styles.inputRow}>
          <Text style={[styles.label, { color: colors.text }]}>Change Username</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
            value={username}
            onChangeText={setUsername}
            placeholder="Enter new username"
            placeholderTextColor={colors.border}
          />
        </View>

        <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={handleSaveUsername}>
          <Text style={styles.buttonText}>Save Username</Text>
        </TouchableOpacity>

        <View style={styles.inputRow}>
          <Text style={[styles.label, { color: colors.text }]}>Change Email</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
            value={email}
            onChangeText={setEmail}
            placeholder="Enter new email"
            placeholderTextColor={colors.border}
          />
        </View>

        <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={handleSendEmailChangeLink}>
          <Text style={styles.buttonText}>Send Email Change Link</Text>
        </TouchableOpacity>

        <View style={styles.inputRow}>
          <Text style={[styles.label, { color: colors.text }]}>Change Password</Text>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <TextInput
              secureTextEntry={!showPassword}
              editable={isReauthenticated}
              style={[
                styles.input,
                {
                  borderColor: colors.border,
                  color: colors.text,
                  backgroundColor: isReauthenticated ? colors.card : colors.border,
                  flex: 1,
                },
              ]}
              value={isReauthenticated ? password : ""}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={colors.border}
            />
            <TouchableOpacity
              onPress={() => {
                if (!isReauthenticated) {
                  navigation.navigate("Reauthenticate");
                } else {
                  setShowPassword(!showPassword);
                }
              }}
            >
              <Ionicons
                name={showPassword ? "eye-off" : "eye"}
                size={20}
                color={colors.text}
                style={{ marginLeft: 10 }}
              />
            </TouchableOpacity>
          </View>
        </View>

        {isReauthenticated && (
          <View style={styles.inputRow}>
            <Text style={[styles.label, { color: colors.text }]}>Confirm Password</Text>
            <TextInput
              secureTextEntry={!showPassword}
              editable={true}
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm new password"
              placeholderTextColor={colors.border}
            />
          </View>
        )}

      <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={handleSetNewPassword}
      >
          <Text style={styles.buttonText}>Set New Password</Text>
      </TouchableOpacity>

      </ScrollView>
    </View>
  );
};

export default EditProfile;

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20 },
  inputRow: { marginTop: 20 },
  label: { marginBottom: 6, fontSize: 14, fontWeight: "500" },
  input: { height: 48, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, fontSize: 16 },
  button: { height: 48, borderRadius: 10, justifyContent: "center", alignItems: "center", marginTop: 20 },
  buttonText: { color: "white", fontSize: 16, fontWeight: "bold" },
  tabContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#ccc",
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 3,
    borderColor: "#6C63FF",
  },
  tabText: {
    fontSize: 16,
    color: "#888",
  },
  activeTabText: {
    color: "#6C63FF",
    fontWeight: "bold",
  },
  profilePictureContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  imageWrapper: {
    alignItems: "center",
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#ccc",
  },
  addPictureText: {
    marginTop: 8,
    color: "#6C63FF",
    fontWeight: "bold",
  },
  
  
});
