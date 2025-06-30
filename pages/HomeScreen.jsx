import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, TextInput, ScrollView } from "react-native";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { Feather } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { onSnapshot, collection, getDocs } from "firebase/firestore";
import { format, subDays } from 'date-fns'; // For date formatting
import CaloriesIntakeCard from './CaloriesIntakeCard';
import { useFonts } from 'expo-font';
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



  

      return () => unsubscribe();
    }, [])
  );


  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
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

        {/* Health Query Card */}
        <View style={styles.card}>
          <View style={styles.cardTextWrapper}>
            <Text style={styles.cardTitle}>Health Information Query</Text>
            <Text style={styles.cardSubtitle}>Let us know about any of your allergies or health complications before we generate your meal plan!</Text>
          </View>
          <TouchableOpacity style={styles.queryButton} onPress={() => navigation.navigate("HealthDetails")}>
            <Text style={styles.queryButtonText}>Answer Query</Text>
          </TouchableOpacity>
        </View>
        
              <TouchableOpacity onPress={() => navigation.navigate('AddMeal')} activeOpacity={0.9}>
                 <CaloriesIntakeCard 
                    totalCalories={totalCalories} 
                    weekData={weekData} 
                    todayLabel={todayLabel} // ✅ Pass today label
                  />
              </TouchableOpacity>

        {/* Stats Cards */}
        <View style={styles.statsRow}>
          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>Streak</Text>
            <Text style={styles.statsValue}>{mealDaysCount}</Text>

            <Text style={styles.statsSubtitle}>Days</Text>
          </View>

          <View style={styles.healthCard}>
  <View style={styles.healthRow}>
    <View style={styles.healthItem}>
      <Text style={styles.healthLabel}>Weight</Text>
      <Text style={styles.healthValue}>
        {weight !== null ? `${weight}` : '--'}
      </Text>
      <Text style={styles.healthUnit}>kg</Text>
    </View>
    <View style={styles.healthItem}>
      <Text style={styles.healthLabel}>Height</Text>
      <Text style={styles.healthValue}>
        {height !== null ? `${height}` : '--'}
      </Text>
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

        <TouchableOpacity
          style={styles.addMealButton}
          onPress={() => navigation.navigate('AddMeal')}>
        <Ionicons name="add" size={28} color="white" />
        </TouchableOpacity>

      </ScrollView>

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate("Home")}>
          <Feather name="home" size={24} color="#6C63FF" />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Feather name="target" size={24} color="#6C63FF" />
          <Text style={styles.navText}>Goals</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate("MealPlan")}>
          <Feather name="clipboard" size={24} color="#6C63FF" />
          <Text style={styles.navText}>Meal Plan</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate("Profile")}>
          <Feather name="user" size={24} color="#6C63FF" />
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
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




});
