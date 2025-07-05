import React, { useState, useLayoutEffect, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert , ImageBackground} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, getFirestore } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../config/firebase-config";
import { LinearGradient } from 'expo-linear-gradient';
import background from "../assets/background.png"; // make sure this exists

import { auth } from "../config/firebase-config.js";
//import { useThemedStyles } from "../hooks/useThemedStyles";

export default function ProfileScreen() {
  const [profileImage, setProfileImage] = useState(null);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [healthDetails, setHealthDetails] = useState({});
  const navigation = useNavigation();
  const db = getFirestore();
const styles = lightStyles;
//const storage = getStorage();

  useLayoutEffect(() => {
    navigation.setOptions({ title: "My Profile" });
  }, [navigation]);

useEffect(() => {
  const fetchUserData = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert("Error", "No user is signed in.");
        return;
      }

      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        setUsername(userData.username || "No username set");
        setProfileImage(userData.photoURL || null);
        setEmail(user.email); // From Firebase Auth

        const health = userData.healthDetails || {};
        setHealthDetails({
          gender: health.gender || "Not set",
          birthday: health.birthday || "Not set",
          age: health.age || "Not set",
          height: health.height || "Not set",
          weight: health.weight || "Not set",
          bmi: health.bmi || "Not set",
          complications: health.complications || [],
          allergies: health.allergies || [],
          bmr: health.bmr || "Not calculated",
          maintenanceCalories: health.maintenanceCalories || "Not calculated",
          targetCalories: health.targetCalories || "Not calculated",
        });
      } else {
        Alert.alert("Error", "User data not found in Firestore.");
      }

    } catch (error) {
      console.error("Error fetching user data:", error);
      Alert.alert("Error", "Failed to load user data.");
    }
  };

  fetchUserData();
}, []);

  const handleEditProfile = () => {
    navigation.navigate("EditProfile");
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      Alert.alert("Logged Out", "You have been signed out.");
      navigation.reset({
  index: 0,
  routes: [{ name: "Login" }],
});

    } catch (error) {
      console.error("Logout error:", error);
      Alert.alert("Error", "Failed to log out.");
    }
  };

const handleDeleteAccount = () => {
  Alert.alert(
    "Delete Account",
    "Are you sure you want to delete your account? This action is irreversible.",
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        onPress: async () => {
          try {
            const user = auth.currentUser;
            if (!user) {
              Alert.alert("Error", "No user is currently signed in.");
              return;
            }

            // 1. Delete Firestore user document
            const userDocRef = doc(db, "users", user.uid);
            await getDoc(userDocRef).then((docSnap) => {
              if (docSnap.exists()) {
                return deleteDoc(userDocRef);
              }
            });

            // 2. Delete Firebase Auth user (requires recent login)
            await user.delete();

            Alert.alert("Account Deleted", "Your account has been deleted.");
            navigation.reset({ index: 0, routes: [{ name: "Login" }] });

          } catch (error) {
            if (error.code === "auth/requires-recent-login") {
              Alert.alert(
                "Reauthentication Required",
                "Please log in again before deleting your account."
              );
              navigation.navigate("Reauthenticate", { onSuccess: "DeleteAccount" });
            } else {
              console.error("Delete account error:", error);
              Alert.alert("Error", "Failed to delete account.");
            }
          }
        },
        style: "destructive",
      },
    ]
  );
};


  return (
    <ImageBackground
  source={background}
  style={styles.outerContainer}
  resizeMode="cover"
>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileSection}>
<View style={styles.profileImageContainer}>
  <Image
    source={profileImage ? { uri: profileImage } : require("../assets/profile-placeholder.png")}
    style={styles.profileImage}
  />
</View>
          <Text style={styles.username}>{username}</Text>
          <Text style={styles.email}>{email}</Text>
        </View>

<View style={styles.card}>
  <Text style={styles.cardTitle}>Health Details</Text>
  <Text style={styles.healthItem}>Gender: {healthDetails.gender}</Text>
  <Text style={styles.healthItem}>Birthday: {healthDetails.birthday}</Text>
  <Text style={styles.healthItem}>Age: {healthDetails.age}</Text>
  <Text style={styles.healthItem}>Height: {healthDetails.height} cm</Text>
  <Text style={styles.healthItem}>Weight: {healthDetails.weight} kg</Text>
  <Text style={styles.healthItem}>BMI: {healthDetails.bmi}</Text>
  <Text style={styles.healthItem}>
    Complications: {(healthDetails.complications || []).length > 0
      ? healthDetails.complications.join(", ")
      : "None"}
  </Text>
  <Text style={styles.healthItem}>
    Allergies: {(healthDetails.allergies || []).length > 0
      ? healthDetails.allergies.join(", ")
      : "None"}
  </Text>
</View>

<View style={styles.card}>
  <Text style={styles.cardTitle}>Calorie Summary</Text>
  <Text style={styles.healthItem}>BMR: {healthDetails.bmr} kcal/day</Text>
  <Text style={styles.healthItem}>Maintenance (TDEE): {healthDetails.maintenanceCalories} kcal/day</Text>
  <Text style={styles.healthItem}>Target Calories: {healthDetails.targetCalories} kcal/day</Text>
</View>



        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderText}>General Settings</Text>
        </View>

        <TouchableOpacity style={styles.settingItem} onPress={handleEditProfile}>
          <Text style={styles.settingText}>Edit Profile</Text>
          <Ionicons name="chevron-forward" size={20} color={styles.icon.color} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem} onPress={handleLogout}>
          <Text style={styles.settingText}>Log Out</Text>
          <Ionicons name="chevron-forward" size={20} color={styles.icon.color} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem} onPress={handleDeleteAccount}>
          <Text style={{ color: "red" }}>Delete Account</Text>
          <Ionicons name="chevron-forward" size={20} color="red" />
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom Navigation Bar */}
<LinearGradient
  colors={['#8E24AA', '#6C63FF']}
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 0 }}
  style={styles.bottomBar}
>
  <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate("Home")}>
    <Feather name="home" size={24} color="#fff" />
    <Text style={styles.navText}>Home</Text>
  </TouchableOpacity>
  <TouchableOpacity style={styles.navItem} onPress={()=>navigation.navigate("Goals")}>
    <Feather name="target" size={24} color="#fff"  />
    <Text style={styles.navText}>Goals</Text>
  </TouchableOpacity>
  <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate("MealPlan")}>
    <Feather name="clipboard" size={24} color="#fff" />
    <Text style={styles.navText}>Meal Plan</Text>
  </TouchableOpacity>
  <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate("Profile")}>
    <Feather name="user" size={24} color="#fff" />
    <Text style={styles.navText}>Profile</Text>
  </TouchableOpacity>
</LinearGradient>

    </ImageBackground>
  );
}

// --- Styles (unchanged except for removing duplicate container key) ---
const lightStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  profileSection: { alignItems: "center", marginTop: 20, marginBottom: 10 },
  profileImage: { width: 100, height: 100, borderRadius: 50, backgroundColor: "#ccc" },
  username: { marginTop: 12, fontSize: 18, fontWeight: "bold" },
  email: { color: "gray", fontSize: 14 },
  sectionHeader: { paddingHorizontal: 20, paddingTop: 30, paddingBottom: 10 },
  sectionHeaderText: { fontSize: 16, fontWeight: "bold", color: "#333" },
  settingItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderColor: "#eee" },
  bottomBar: { height: 70, backgroundColor: "#f8f8f8", flexDirection: "row", justifyContent: "space-around", alignItems: "center", borderTopWidth: 1, borderTopColor: "#ddd" },
  navItem: { alignItems: "center", justifyContent: "center" ,},
  navText: { fontSize: 12, marginTop: 4, color: "#333" },
  outerContainer: { flex: 1, backgroundColor: "#transparent" },
  scrollContent: { paddingBottom: 90 },
  settingText: { color: "#000" },
  icon: { color: "#000" },
  healthSection: { paddingHorizontal: 20, paddingVertical: 10 },
healthItem: { fontSize: 14, marginBottom: 6, color: "#333" },
changePhotoText: {
  fontSize: 12,
  color: "#7C3AED",
  marginTop: 4,
},

bottomBar: {
  position: "absolute",
  bottom: 0,
  left: 0,
  right: 0,
  height: 70,
  flexDirection: "row",
  justifyContent: "space-around",
  alignItems: "center",
  borderTopLeftRadius: 20,
  borderTopRightRadius: 20,
  overflow: "hidden",
  backgroundColor: "#6C63FF",
},
navText: {
  fontSize: 12,
  marginTop: 4,
  color: "#fff",
},
card: {
  backgroundColor: '#fff',
  marginHorizontal: 20,
  marginVertical: 10,
  borderRadius: 12,
  padding: 16,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 4,
},
cardTitle: {
  fontSize: 16,
  fontWeight: 'bold',
  marginBottom: 10,
  color: '#333',
},


});

const darkStyles = StyleSheet.create({
  ...lightStyles,
  container: { flex: 1, backgroundColor: "#121212" },
  sectionHeaderText: { fontSize: 16, fontWeight: "bold", color: "#ddd" },
  settingText: { color: "#fff" },
  icon: { color: "#fff" },
  navText: { fontSize: 12, marginTop: 4, color: "#fff" },
});
