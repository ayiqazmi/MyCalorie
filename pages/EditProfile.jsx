import React, { useState, useLayoutEffect } from "react";
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
import { useTheme } from "@react-navigation/native";
import { Home, Target, ClipboardList, User  } from "lucide-react-native";
import { useThemedStyles } from "../hooks/useThemedStyles"; // adjust path;
//import { useTheme } from "../ThemeContext"; // adjust path
import { getAuth, onAuthStateChanged, updatePassword, EmailAuthProvider, reauthenticateWithCredential, } from "firebase/auth";
import { auth, db } from "../config/firebase-config.js";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";





const EditProfile = ({ navigation }) => {
    const styles = useThemedStyles(lightStyles, darkStyles);
    const { colors } = useTheme();
  

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);


  const handleSave = async () => {
    if (!username.trim() || !email.trim()) {
      Alert.alert("Validation Error", "All fields must be filled.");
      return;
    }
  
    setLoading(true);
  
    try {
      const user = auth.currentUser;
  
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        await updateDoc(userDocRef, {
          username: username.trim(),
          email: email.trim(),
        });
  
        Alert.alert("Success", "Profile updated successfully.", [
          {
            text: "OK",
            onPress: () => navigation.goBack(),
          },
        ]);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Update Failed", "There was a problem updating your profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSetNewPassword = async () => {
    if (!password.trim() || !confirmPassword.trim()) {
      Alert.alert("Validation Error", "Password fields cannot be empty.");
      return;
    }
  
    if (password !== confirmPassword) {
      Alert.alert("Validation Error", "Passwords do not match.");
      return;
    }
  
    try {
      const user = auth.currentUser; // Get the currently authenticated user
      if (user) {
        await updatePassword(user, password.trim());
        Alert.alert("Success", "Password updated successfully.");
      } else {
        Alert.alert("Error", "User is not authenticated.");
      }
    } catch (error) {
        if (error.code === "auth/requires-recent-login") {
            // Handle session expiration
            Alert.alert(
              "Session Expired",
              "Your session has expired. Please log in again to update your password.",
              [
                {
                  text: "OK",
                  onPress: () => navigation.navigate("Login"), // Redirect to login screen
                },
              ]
            );
        } else {
            console.error("Error updating password:", error);
            Alert.alert("Error", "Failed to update password. Please try again.");
    }}
  };

  

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Edit Profile',
    });
    const fetchUserData = async () => {
        try {
          const user = auth.currentUser;
          if (user) {
            const userDocRef = doc(db, "users", user.uid);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
              const userData = userDoc.data();
              setUsername(userData.username || "");
              setEmail(userData.email || "");
            }
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      };
    
      fetchUserData();
  }, [navigation]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}

      

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Navigate to Health Details */}
        <TouchableOpacity
          style={styles.sectionRow}
          onPress={() => navigation.navigate("EditHealthDetails")}
        >
          <Text style={[styles.sectionText, { color: colors.text }]}>About You | Health Details</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.text} />
        </TouchableOpacity>

        {/* Profile Picture (Placeholder) */}
        <TouchableOpacity style={styles.inputRow}>
          <Text style={[styles.label, { color: colors.text }]}>Add Profile Picture</Text>
        </TouchableOpacity>

        {/* Username */}
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

        {/* Email */}
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

        {/* Password */}
        <View style={styles.inputRow}>
  <Text style={[styles.label, { color: colors.text }]}>Change Password</Text>
  <View style={{ flexDirection: "row", alignItems: "center" }}>
    <TextInput
      secureTextEntry={!showPassword} // Toggle visibility
      style={[styles.input, { borderColor: colors.border, color: colors.text, flex: 1 }]}
      value={password} // Display the password
      onChangeText={setPassword} // Update the password state
      placeholder="New password"
      placeholderTextColor={colors.border}
    />
    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
      <Ionicons
        name={showPassword ? "eye-off" : "eye"} // Toggle icon
        size={20}
        color={colors.text}
        style={{ marginLeft: 10 }}
      />
    </TouchableOpacity>
  </View>
</View>

        {/* Confirm Password */}
        <View style={styles.inputRow}>
  <Text style={[styles.label, { color: colors.text }]}>Confirm Password</Text>
  <View style={{ flexDirection: "row", alignItems: "center" }}>
    <TextInput
      secureTextEntry={!showPassword} // Toggle visibility
      style={[styles.input, { borderColor: colors.border, color: colors.text, flex: 1 }]}
      value={confirmPassword}
      onChangeText={setConfirmPassword}
      placeholder="Confirm new password"
      placeholderTextColor={colors.border}
    />
    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
      <Ionicons
        name={showPassword ? "eye-off" : "eye"}
        size={20}
        color={colors.text}
        style={{ marginLeft: 10 }}
      />
    </TouchableOpacity>
  </View>
</View>

<TouchableOpacity onPress={handleSetNewPassword}>
  <Text style={[styles.saveText, { color: colors.primary }]}>Set New Password</Text>
</TouchableOpacity>

        <TouchableOpacity onPress={handleSave}>
          <Text style={[styles.saveText, { color: colors.primary }]}>Save</Text>
        </TouchableOpacity>
        </ScrollView>   

        {/* Bottom space for bottom nav */}
        <View style={{ height: 90 }} />
        {/* Bottom Navigation Bar */}
        <View style={styles.bottomBar}>
              <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate("Home")}>
                <Home size={24} color={styles.icon.color} />
                <Text style={styles.navText}>Home</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.navItem} onPress={() => {/* navigate to Goals */}}>
                <Target size={24} color={styles.icon.color} />
                <Text style={styles.navText}>Goals</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.navItem} onPress={() => {/* navigate to Meal Plan */}}>
                <ClipboardList size={24} color={styles.icon.color} />
                <Text style={styles.navText}>Meal Plan</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate("Profile")}>
                <User size={24} color={styles.icon.color} />
                <Text style={styles.navText}>Profile</Text>
              </TouchableOpacity>
            </View>
      
    </View>
  );
};

export default EditProfile;

const lightStyles = StyleSheet.create({
    container: {
        flex: 1,
      },
      header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderColor: "#ccc",
      },
      
      saveText: {
        fontSize: 16,
        fontWeight: "bold",
      },
      scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 20,
      },
      sectionRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderColor: "#ddd",
      },
      sectionText: {
        fontSize: 16,
        fontWeight: "600",
      },
      inputRow: {
        marginTop: 20,
      },
      label: {
        marginBottom: 6,
        fontSize: 14,
        fontWeight: "500",
      },
      input: {
        height: 48,
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 12,
        fontSize: 16,
      },
      bottomBar: {
        height: 70,
        backgroundColor: "#f8f8f8",
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: "center",
        borderTopWidth: 1,
        borderTopColor: "#ddd",
      },
      navItem: {
        alignItems: "center",
        justifyContent: "center",
      },
      navText: {
        fontSize: 12,
        marginTop: 4,
        color: "#333",
      },
      outerContainer: {
        flex: 1,
        backgroundColor: "#fff",
      },
      
      scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 90, // for bottom nav
        paddingTop: 20,      },
      settingText: {
        color: "#000",
      },
      icon: {
        color: "#000",
      },
  });
  
  const darkStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#121212",
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingTop: 50,
      paddingBottom: 10,
      borderBottomWidth: 1,
      borderColor: "#888", // lighter for dark mode
    },
    headerText: {
      fontSize: 20,
      fontWeight: "bold",
      marginLeft: 10,
      color: "#fff",
    },
    profileSection: {
      alignItems: "center",
      marginTop: 20,
      marginBottom: 10,
    },
    imageWrapper: {
      position: "relative",
    },
    profileImage: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: "#444",
    },
    cameraIcon: {
      position: "absolute",
      right: 0,
      bottom: 0,
      backgroundColor: "#000",
      borderRadius: 20,
      padding: 4,
    },
    username: {
      marginTop: 12,
      fontSize: 18,
      fontWeight: "bold",
      color: "#fff",
    },
    email: {
      color: "#bbb",
      fontSize: 14,
    },
    sectionHeader: {
      paddingHorizontal: 20,
      paddingTop: 30,
      paddingBottom: 10,
    },
    sectionHeaderText: {
      fontSize: 16,
      fontWeight: "bold",
      color: "#ddd",
    },
    settingItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 16,
      paddingHorizontal: 20,
      borderBottomWidth: 1,
      borderColor: "#555",
    },
    bottomBar: {
      height: 70,
      backgroundColor: "#1e1e1e",
      flexDirection: "row",
      justifyContent: "space-around",
      alignItems: "center",
      borderTopWidth: 1,
      borderTopColor: "#444",
    },
    navItem: {
      alignItems: "center",
      justifyContent: "center",
    },
    navText: {
      fontSize: 12,
      marginTop: 4,
      color: "#fff",
    },
    outerContainer: {
      flex: 1,
      backgroundColor: "#121212",
    },
    scrollContent: {
      paddingBottom: 90,
    },
    settingText: {
      color: "#fff",
    },
    icon: {
      color: "#fff",
    },
  });


  