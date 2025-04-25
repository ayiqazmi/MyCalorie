import React, { useState,useLayoutEffect, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from '@react-navigation/native';
import { Home, Target, ClipboardList, User  } from "lucide-react-native";
import { getAuth, onAuthStateChanged } from "firebase/auth";
//import { auth } from "../config/firebase-config.js";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { useTheme } from "../ThemeContext"; // adjust path
//import { StatusBar } from "expo-status-bar";
import { useThemedStyles } from "../hooks/useThemedStyles"; // adjust path




export default function ProfileScreen() {
  const [profileImage, setProfileImage] = useState(null);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const navigation = useNavigation();
  const auth = getAuth();
  const db = getFirestore();
  const styles = useThemedStyles(lightStyles, darkStyles);
  

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'My Profile',
    });
  }, [navigation]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
  
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          setUsername(userData.username || "No username set");
          setEmail(user.email); // Still use email from Firebase Auth
          if (userData.photoURL) {
            setProfileImage(userData.photoURL);
          }
        } else {
          console.log("No user document found!");
        }
      }
    });

    return unsubscribe; // cleanup listener on unmount
  }, []);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert("Delete Account", "Are you sure you want to delete your account?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", onPress: () => console.log("Account deleted") },
    ]);
  };
  
const { theme, toggleTheme } = useTheme();

//const isDark = theme === "dark";

const isDark = theme === "dark";




  return (
    <View style={styles.outerContainer}>

    <ScrollView style={styles.container}
      contentContainerStyle={styles.scrollContent}
    >
      

      {/* Profile Section */}
      <View style={styles.profileSection}>
        <View style={styles.imageWrapper}>
          <Image
            source={
              profileImage
                ? { uri: profileImage }
                : require("../assets/profile-placeholder.png")
            }
            style={styles.profileImage}
          />
          <TouchableOpacity onPress={pickImage} style={styles.cameraIcon}>
            <Ionicons name="camera" size={20} color="white" />
          </TouchableOpacity>
        </View>
        <Text style={styles.username}>{username}</Text>
        <Text style={styles.email}>{email}</Text>
      </View>

      {/* General Settings */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionHeaderText}>General Settings</Text>
      </View>

      <TouchableOpacity style={styles.settingItem} onPress={toggleTheme}>
  <Text style={styles.settingText}>{isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}</Text>
  <Ionicons name="chevron-forward" size={20} color={styles.icon.color} />
</TouchableOpacity>


      <TouchableOpacity
  style={styles.settingItem}
  onPress={() => navigation.navigate("EditProfile")}
>
  <Text style={styles.settingText}>Edit Profile</Text>
  <Ionicons name="chevron-forward" size={20} color={styles.icon.color} />
</TouchableOpacity>

<TouchableOpacity style={styles.settingItem}>
  <Text style={styles.settingText}>Change Language</Text>
  <Ionicons name="chevron-forward" size={20} color={styles.icon.color} />
</TouchableOpacity>

      <TouchableOpacity style={styles.settingItem} onPress={handleDeleteAccount}>
        <Text style={{ color: "red" }}>Delete Account</Text>
        <Ionicons name="chevron-forward" size={20} color="red" />
      </TouchableOpacity>
      </ScrollView>


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
}
const lightStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderColor: "#ddd",
  },
  headerText: {
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 10,
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
    backgroundColor: "#ccc",
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
  },
  email: {
    color: "gray",
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
    color: "#333",
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderColor: "#eee",
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
    paddingBottom: 90, // Ensures content doesn't get hidden behind the bottom bar
  },
  settingText: {
    color: "#000",
  },
  icon: {
    color: "#000",
  },
  // other styles...
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


/*const styles = StyleSheet.create({
  
});*/
