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
import { storage, auth, db } from "../config/firebase-config.js";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { verifyBeforeUpdateEmail, updatePassword } from "firebase/auth";
import { getReauthenticated, setReauthenticated } from "./auth/utils/authState"; // Adjust the path as needed
import * as ImagePicker from "expo-image-picker";
import { Image, ImageBackground } from "react-native";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Feather } from '@expo/vector-icons';





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
    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Error", "No authenticated user found.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });

    if (!result.canceled && result.assets?.length > 0) {
      const uri = result.assets[0].uri;
      setProfileImage(uri); // Show immediately

      const response = await fetch(uri);
      const blob = await response.blob();

      const storageRef = ref(storage, `profilePictures/${user.uid}.jpg`);

      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);

      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, { photoURL: downloadURL });

      setProfileImage(downloadURL); // Update with actual Firebase URL
      Alert.alert("Success", "Profile picture updated.");
    }
  } catch (error) {
    console.error("Image upload error:", error);
    Alert.alert("Upload Failed", error.message || "An unknown error occurred.");
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
// ...imports and logic stay the same above this line

<ImageBackground source={require('../assets/background.png')} style={{ flex: 1 }} resizeMode="cover">
  <ScrollView contentContainerStyle={styles.container}>
    {/* Tabs */}
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'About You' && styles.activeTab]}
        onPress={() => setActiveTab('About You')}
      >
        <Text style={[styles.tabText, activeTab === 'About You' && styles.activeTabText]}>About You</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'HealthDetails' && styles.activeTab]}
        onPress={() => navigation.navigate('HealthDetails')}
      >
        <Text style={[styles.tabText, activeTab === 'HealthDetails' && styles.activeTabText]}>Health Details</Text>
      </TouchableOpacity>
    </View>

    {/* Profile Image */}
    <TouchableOpacity style={styles.imageWrapper} onPress={pickImage}>
      <Image
        source={profileImage ? { uri: profileImage } : require('../assets/profile-placeholder.png')}
        style={styles.profileImage}
      />
      <Text style={styles.addText}>Add Profile Picture</Text>
    </TouchableOpacity>

    {/* Username */}
    <View style={styles.inputBox}>
      <TextInput
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        style={styles.input}
        placeholderTextColor="#888"
      />
    </View>
    <TouchableOpacity style={styles.button} onPress={handleSaveUsername}>
      <Text style={styles.buttonText}>Save Username</Text>
    </TouchableOpacity>

    {/* Email */}
    <View style={styles.inputBox}>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        placeholderTextColor="#888"
        keyboardType="email-address"
        autoCapitalize="none"
      />
    </View>
    <TouchableOpacity style={styles.button} onPress={handleSendEmailChangeLink}>
      <Text style={styles.buttonText}>Send Email Change Link</Text>
    </TouchableOpacity>

    {/* Password */}
    <View style={styles.inputBox}>
      <View style={styles.passwordRow}>
        <TextInput
          placeholder="New Password"
          value={isReauthenticated ? password : ''}
          onChangeText={setPassword}
          style={[styles.input, { flex: 1 }]}
          secureTextEntry={!showPassword}
          editable={isReauthenticated}
          placeholderTextColor="#888"
        />
        <TouchableOpacity
          onPress={() => {
            if (!isReauthenticated) navigation.navigate('Reauthenticate');
            else setShowPassword(!showPassword);
          }}
        >
          <Feather
            name={showPassword ? 'eye-off' : 'eye'}
            size={20}
            color="#6A1B9A"
            style={{ marginLeft: 8 }}
          />
        </TouchableOpacity>
      </View>
    </View>

    {isReauthenticated && (
      <View style={styles.inputBox}>
        <TextInput
          placeholder="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          style={styles.input}
          secureTextEntry={!showPassword}
          placeholderTextColor="#888"
        />
      </View>
    )}

    <TouchableOpacity style={styles.button} onPress={handleSetNewPassword}>
      <Text style={styles.buttonText}>Set New Password</Text>
    </TouchableOpacity>
  </ScrollView>
</ImageBackground>

  );
};

export default EditProfile;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 30,
    overflow: 'hidden',
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#E0BBFF',
  },
  activeTab: {
    backgroundColor: '#8E24AA',
  },
  tabText: {
    color: '#6A1B9A',
    fontWeight: 'bold',
  },
  activeTabText: {
    color: 'white',
  },
  imageWrapper: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#ccc',
  },
  addText: {
    marginTop: 6,
    color: '#6A1B9A',
    fontWeight: 'bold',
  },
  inputBox: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 30,
    paddingHorizontal: 16,
    marginVertical: 8,
  },
  input: {
    height: 50,
    color: '#000',
  },
  button: {
    backgroundColor: '#8E24AA',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 30,
    marginTop: 10,
    width: '100%',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

