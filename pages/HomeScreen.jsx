import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, TextInput, ScrollView, ImageBackground } from "react-native";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";
import { Feather } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { onSnapshot, collection, getDocs } from "firebase/firestore";
import { format, subDays } from 'date-fns'; // For date formatting
import CaloriesIntakeCard from './CaloriesIntakeCard';
import { useFonts } from 'expo-font';
import background from '../assets/background.png';
import logo from '../assets/MyCalorie.png';
import { LinearGradient } from 'expo-linear-gradient';



import AppLoading from 'expo-app-loading';




export default function HomeScreen() {
    const [fontsLoaded] = useFonts({
    // automatically loads vector-icons with expo
    ...Ionicons.font,
    ...Feather.font,
  });

  if (!fontsLoaded) {
    return <AppLoading />;
  }
  const [username, setUsername] = useState("");
  const [profilePic, setProfilePic] = useState(null);
  const [weekData, setWeekData] = useState([]);
const [totalCalories, setTotalCalories] = useState(0);
const [weight, setWeight] = useState(null);
const [height, setHeight] = useState(null);
const [bmi, setBmi] = useState(null);
const [mealDaysCount, setMealDaysCount] = useState(0);
  const [feedbacks, setFeedbacks] = useState([]);



  //const totalCalories = 900; // This will come from Firestore later


  const navigation = useNavigation();
  const auth = getAuth();
  const db = getFirestore();
  const todayLabel = format(new Date(), 'EEE')[0];

  useFocusEffect(
    React.useCallback(() => {
      const user = auth.currentUser;
      if (!user) return;

      // Fetch user profile
      const userDocRef = doc(db, "users", user.uid);
      getDoc(userDocRef).then((docSnap) => {
        if (docSnap.exists()) {
          const userData = docSnap.data();
          setUsername(userData.username || "User");
          setProfilePic(userData.photoURL || null);
        } else {
          console.log("No user profile found.");
          setUsername("User");
          setProfilePic(null);
        }
      }).catch((error) => {
        console.error("Error fetching user profile:", error);
      });

      // Fetch today's meal calories
      const date = new Date().toISOString().split("T")[0];
      const mealDocRef = doc(db, "users", user.uid, "meals", date);



      const unsubscribe = onSnapshot(mealDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const mealsData = docSnap.data();
          let total = 0;
          Object.values(mealsData).forEach(mealType => {
            total += mealType.totalCalories || 0;
          });
          setTotalCalories(total);
        } else {
          setTotalCalories(0);
        }
      });

const fetchFeedbacks = async () => {
  const user = auth.currentUser;
  if (!user) return;

  const feedbackRef = collection(db, "users", user.uid, "feedbacks");
  const snapshot = await getDocs(feedbackRef);
  const data = snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());

  setFeedbacks(data.slice(0, 3)); // Only show latest 3
};

const unsub = onSnapshot(doc(db, "users", user.uid), async (docSnap) => {
  const data = docSnap.data();
  if (data?.hasNewFeedback) {
    Alert.alert("📝 New Feedback", "You have new feedback from an admin!");

    await updateDoc(docSnap.ref, { hasNewFeedback: false });
    fetchFeedbacks(); // refresh after feedback
  }
});

fetchFeedbacks(); // run on mount too

      const fetchCaloriesHistory = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const today = new Date();
    const days = [...Array(7)].map((_, i) => {
      const date = subDays(today, 6 - i);
      return { label: format(date, 'EEE')[0], fullDate: format(date, 'yyyy-MM-dd') };
    });

    const caloriesResults = [];

    for (const { label, fullDate } of days) {
      const docRef = doc(db, "users", user.uid, "meals", fullDate);
      const docSnap = await getDoc(docRef);

      let total = 0;
      if (docSnap.exists()) {
        const data = docSnap.data();
        Object.values(data).forEach(meal => {
          total += meal.totalCalories || 0;
        });
      }

      caloriesResults.push({ day: label, value: total });

      // Today’s calories
      if (fullDate === format(today, 'yyyy-MM-dd')) {
        setTotalCalories(total);
      }
    }

    setWeekData(caloriesResults);
  };

  fetchCaloriesHistory();

const fetchHealthDetails = async () => {
  const user = auth.currentUser;
  if (!user) return;

  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    const data = userSnap.data();
    const health = data.healthDetails || {};
    
    console.log("✅ healthDetails:", health); // ← check this shows BMI

    setWeight(health.weight ?? null);
    setHeight(health.height ?? null);
    setBmi(health.bmi ? parseFloat(health.bmi) : null); // ← this line converts string to number
  } else {
    console.log("⚠️ No user document found.");
  }
};
  fetchHealthDetails();

const fetchLoggedMealDays = async () => {
  const user = auth.currentUser;
  if (!user) return;

  const mealsRef = collection(db, "users", user.uid, "meals");
  const snapshot = await getDocs(mealsRef);

  const daysLogged = snapshot.docs.length;
  setMealDaysCount(daysLogged);
};

fetchLoggedMealDays();



  

      return () => unsubscribe(); unsub();
    }, [])
  );


return (
  <ImageBackground
    source={background}
    style={{ flex: 1 }}
    resizeMode="cover"
  >
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      {/* Header Logo */}
      <View style={styles.logoWrapper}>
        <Image source={logo} style={styles.logo} />
        <Text style={styles.brandText}>MyCalorie</Text>
      </View>

      {/* Top Bar */}
      <View style={styles.topBar}>
        <TextInput placeholder="Search here ..." style={styles.searchBox} placeholderTextColor="#999" />
        <Ionicons name="notifications-outline" size={24} color="#6C63FF" />
      </View>

      {/* Welcome Banner */}
      <View style={styles.welcomeBanner}>
        <Image
          source={profilePic ? { uri: profilePic } : require("../assets/profile-placeholder.png")}
          style={styles.profilePic}
        />
        <View>
          <Text style={styles.welcomeText}>Welcome!</Text>
          <Text style={styles.usernameText}>{username}</Text>
        </View>
      </View>

      {/* Health Info Query Card */}
      <View style={styles.card}>
        <View style={styles.cardTextWrapper}>
          <Text style={styles.cardTitle}>Health Information Query</Text>
          <Text style={styles.cardSubtitle}>
            Let us know about any of your allergies or health complications before we generate your meal plan!
          </Text>
        </View>
        <TouchableOpacity style={styles.queryButton} onPress={() => navigation.navigate("HealthDetails")}>
          <Text style={styles.queryButtonText}>Answer Query</Text>
        </TouchableOpacity>
      </View>

      {/* Calories Intake Card */}
      <TouchableOpacity onPress={() => navigation.navigate('AddMeal')} activeOpacity={0.9}>
        <CaloriesIntakeCard
          totalCalories={totalCalories}
          weekData={weekData}
          todayLabel={todayLabel}
        />
      </TouchableOpacity>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        {/* Streak Card */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Streak</Text>
          <Text style={styles.statsValue}>{mealDaysCount}</Text>
          <Text style={styles.statsSubtitle}>Days</Text>
        </View>

        {/* Health Info Card */}
        <View style={styles.healthCard}>
          <View style={styles.healthRow}>
            <View style={styles.healthItem}>
              <Text style={styles.healthLabel}>Weight</Text>
              <Text style={styles.healthValue}>{weight ?? "--"}</Text>
              <Text style={styles.healthUnit}>kg</Text>
            </View>
            <View style={styles.healthItem}>
              <Text style={styles.healthLabel}>Height</Text>
              <Text style={styles.healthValue}>{height ?? "--"}</Text>
              <Text style={styles.healthUnit}>cm</Text>
            </View>
            <View style={styles.healthItem}>
              <Text style={styles.healthLabel}>BMI</Text>
              <Text style={styles.healthValue}>
                {typeof bmi === 'number' ? bmi.toFixed(1) : '--'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Feedback Cards */}
      {feedbacks.length > 0 && (
        <View style={styles.feedbackContainer}>
          <Text style={styles.feedbackHeader}>📋 Admin Feedback</Text>
          {feedbacks.map((fb) => (
            <View key={fb.id} style={styles.feedbackCard}>
              <Text style={styles.feedbackDate}>
                {fb.createdAt?.toDate().toLocaleDateString() ?? 'Unknown Date'}
              </Text>
              <Text style={styles.feedbackMessage}>{fb.message}</Text>
              <Text style={styles.feedbackFrom}>👤 {fb.givenBy ?? 'Admin'}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Floating Add Meal Button */}
      <TouchableOpacity
        style={styles.addMealButton}
        onPress={() => navigation.navigate('AddMeal')}>
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>
    </ScrollView>

<LinearGradient
  colors={['#8E24AA', '#6C63FF']}
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 0 }}
  style={styles.bottomBar}
>
  <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate("Home")}>
    <Feather name="home" size={24} color="#fff" />
    <Text style={styles.navTextWhite}>Home</Text>
  </TouchableOpacity>
  <TouchableOpacity style={styles.navItem} onPress={()=>navigation.navigate("HealthDetails")}>
    <Feather name="target" size={24} color="#fff" />
    <Text style={styles.navTextWhite}>Goals</Text>
  </TouchableOpacity>
  <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate("MealPlan")}>
    <Feather name="clipboard" size={24} color="#fff" />
    <Text style={styles.navTextWhite}>Meal Plan</Text>
  </TouchableOpacity>
  <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate("Profile")}>
    <Feather name="user" size={24} color="#fff" />
    <Text style={styles.navTextWhite}>Profile</Text>
  </TouchableOpacity>
</LinearGradient>

  </ImageBackground>
);

}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  scrollContainer: { padding: 20, paddingBottom: 100 },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  logo: { width: 120, height: 40, resizeMode: "contain" },
  searchBox: { flex: 1, marginHorizontal: 12, padding: 10, borderWidth: 1, borderColor: "#ccc", borderRadius: 8 },
  welcomeBanner: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  profilePic: { width: 50, height: 50, borderRadius: 25, backgroundColor: "#ddd", marginRight: 12 },
  welcomeText: { fontSize: 14, color: "#888" },
  usernameText: { fontSize: 18, fontWeight: "bold", color: "#333" },
  card: { backgroundColor: "#fff", borderRadius: 12, padding: 16, marginBottom: 16, elevation: 2 },
  cardTextWrapper: { marginBottom: 10 },
  cardTitle: { fontSize: 16, fontWeight: "bold", color: "#333" },
  cardSubtitle: { fontSize: 14, color: "#666", marginTop: 4 },
  queryButton: { backgroundColor: "#6C63FF", paddingVertical: 12, borderRadius: 8, alignItems: "center" },
  queryButtonText: { color: "#fff", fontWeight: "bold" },
  statsRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  statsCard: { flex: 1, backgroundColor: "#fff", borderRadius: 12, padding: 16, alignItems: "center", marginHorizontal: 4 },
  statsTitle: { fontSize: 14, color: "#666", marginBottom: 8 },
  statsValue: { fontSize: 20, fontWeight: "bold", color: "#333" },
  statsSubtitle: { fontSize: 12, color: "#999", marginTop: 4 },
  bottomBar: { position: "absolute", bottom: 0, left: 0, right: 0, height: 70, backgroundColor: "#fff", flexDirection: "row", justifyContent: "space-around", alignItems: "center", borderTopWidth: 1, borderColor: "#eee" },
  navItem: { alignItems: "center" },
  navText: { fontSize: 12, color: "#6C63FF", marginTop: 4 },
  addMealButton: {
  position: 'absolute',
  bottom: 90, // Adjust based on your layout
  right: 20,
  backgroundColor: '#6C63FF',
  width: 60,
  height: 60,
  borderRadius: 30,
  alignItems: 'center',
  justifyContent: 'center',
  elevation: 5,
},
healthCard: {
  flex: 2,
  backgroundColor: '#fff',
  borderRadius: 12,
  padding: 16,
  marginHorizontal: 4,
  elevation: 2,
},
healthRow: {
  flexDirection: 'row',
  justifyContent: 'space-around',
},
healthItem: {
  alignItems: 'center',
  paddingHorizontal: 8,
},
healthValue: {
  fontSize: 20,
  fontWeight: 'bold',
  color: '#333',
  textAlign: 'center',
},
healthUnit: {
  fontSize: 12,
  color: '#999',
  marginBottom: 4,
  textAlign: 'center',
},
healthLabel: {
  fontSize: 13,
  color: '#666',
  marginTop: 4,
  textAlign: 'center',
},
feedbackContainer: {
  marginTop: 16,
  backgroundColor: '#fff',
  borderRadius: 12,
  padding: 16,
  elevation: 2,
},
feedbackHeader: {
  fontSize: 16,
  fontWeight: 'bold',
  color: '#333',
  marginBottom: 10,
},
feedbackCard: {
  backgroundColor: '#f4f4f4',
  borderRadius: 10,
  padding: 12,
  marginBottom: 10,
},
feedbackDate: {
  fontSize: 12,
  color: '#888',
  marginBottom: 4,
},
feedbackMessage: {
  fontSize: 14,
  color: '#333',
  marginBottom: 6,
},
feedbackFrom: {
  fontSize: 12,
  color: '#666',
  textAlign: 'right',
},
logoWrapper: {
  alignItems: 'center',
  marginBottom: 16,
  marginTop: 40,
},
logo: {
  width: 80,
  height: 80,
  resizeMode: 'contain',
  marginBottom: 4,
},
brandText: {
  fontSize: 22,
  fontWeight: 'bold',
  color: '#7C3AED',
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
},
navTextWhite: {
  fontSize: 12,
  color: "#fff",
  marginTop: 4,
},




});
