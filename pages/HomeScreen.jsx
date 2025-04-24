import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Image, TextInput, TouchableOpacity } from "react-native";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { Bell, Home, Target, ClipboardList, User  } from "lucide-react-native"; // Make sure you install lucide-react-native
import { useNavigation } from "@react-navigation/native";
import { useThemedStyles } from "../hooks/useThemedStyles"; // adjust path
import { useTheme } from "../ThemeContext"; // adjust path


export default function HomeScreen() {
  const [username, setUsername] = useState("");
  const auth = getAuth();
  const db = getFirestore();
  const navigation = useNavigation();
  const styles = useThemedStyles(lightStyles, darkStyles);
  const { theme, toggleTheme } = useTheme();



  useEffect(() => {
    const fetchUsername = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setUsername(userDoc.data().username);
        }
      }
    };

    fetchUsername();
  }, []);

  return (
    <View style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        {/* Logo placeholder */}
        <View style={styles.logo} />

        {/* Textbox */}
        <TextInput
          placeholder="Search..."
          style={styles.searchBox}
          placeholderTextColor="#999"
        />

        {/* Profile pic + username + bell */}
        <View style={styles.userSection}>
        <TouchableOpacity onPress={() => navigation.navigate("Profile")}>
          <View style={styles.profilePic} />
          </TouchableOpacity>
          <Text style={styles.welcomeText}>Welcome, {username}!</Text>
          <Bell color="#333" size={24} />
        </View>
      </View>

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
  container: { backgroundColor: "#fff", flex: 1 },
  text: { color: "#000" },
  container: {
    padding: 20,
    backgroundColor: "#fff",
    flex: 1,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logo: {
    width: 40,
    height: 40,
    backgroundColor: "#ccc",
    borderRadius: 8,
  },
  searchBox: {
    flex: 1,
    height: 40,
    marginHorizontal: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  userSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  profilePic: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#bbb",
  },
  welcomeText: {
    fontSize: 14,
    fontWeight: "600",
    marginHorizontal: 6,
  },

  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
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
  icon: {
    color: "#000",
  },
});

const darkStyles = StyleSheet.create({
  container: { backgroundColor: "#000", flex: 1 },
  text: { color: "#fff" },
  container: {
    padding: 20,
    backgroundColor: "#121212",
    flex: 1,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logo: {
    width: 40,
    height: 40,
    backgroundColor: "#ccc",
    borderRadius: 8,
  },
  searchBox: {
    flex: 1,
    height: 40,
    marginHorizontal: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  userSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  profilePic: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#bbb",
  },
  welcomeText: {
    fontSize: 14,
    fontWeight: "600",
    marginHorizontal: 6,
    color: "#fff",
  },

  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
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
  icon: {
    color: "#fff",
  },
  
});


const styles = StyleSheet.create({
 

});
