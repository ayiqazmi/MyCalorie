import React, { useState, useEffect, useCallback} from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator, Button } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { generateMealPlan } from '../utils/generateMealPlan';
import { getAuth } from 'firebase/auth';
import { doc, getDoc, setDoc, collection } from 'firebase/firestore';
import { db } from '../config/firebase-config';
import { format } from 'date-fns'; // if you don’t have this, use simple toISOString()
import { useFocusEffect } from '@react-navigation/native';
//import { CheckSquare } from 'lucide-react-native';




const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function MealPlanScreen({ route, navigation }) {
  const [mealPlan, setMealPlan] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  //const navigation = useNavigation();
useFocusEffect(
  useCallback(() => {
    const updateFromParams = async () => {
      const { updatedMeal, updatedMealType, updatedDate } = route.params || {};

      // Make sure all required values are present
      if (updatedMeal && updatedMealType && updatedDate) {
        const auth = getAuth();
        const currentUser = auth.currentUser;
        if (!currentUser) return;

        const parsedDate = new Date(updatedDate); // string to Date
        const dateKey = format(parsedDate, 'yyyy-MM-dd');
        const mealDocRef = doc(db, 'users', currentUser.uid, 'mealPlans', dateKey);
        const existing = await getDoc(mealDocRef);

        let updatedPlan = {};
        if (existing.exists()) {
          const oldPlan = existing.data().plan || {};
          updatedPlan = {
            ...oldPlan,
            [updatedMealType]: [updatedMeal],
          };
        } else {
          updatedPlan = {
            [updatedMealType]: [updatedMeal],
          };
        }

        await setDoc(mealDocRef, {
          plan: updatedPlan,
          updatedAt: new Date().toISOString(),
        });

        setMealPlan(updatedPlan);
        setSelectedDate(parsedDate);

        // Clear params to prevent infinite loop
        navigation.setParams({
          updatedMeal: undefined,
          updatedMealType: undefined,
          updatedDate: undefined,
        });
      }
    };

    updateFromParams();
  }, [route.params])
);





useEffect(() => {
  const fetchOrGenerateWeekPlan = async () => {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const userDocRef = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userDocRef);

      if (!userSnap.exists()) return;

      const userData = userSnap.data();
      const userProfile = {
        allergies: userData.allergies || [],
        healthComplications: userData.healthComplications || [],
        healthGoal: userData.healthGoal || 'maintain',
        caloriesGoal: userData.targetCalories || 2000,
      };

      const today = new Date();
      const weekPlans = {};

      for (let i = 0; i < 7; i++) {
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() + i);
        const formatted = format(targetDate, 'yyyy-MM-dd');

        const mealDocRef = doc(db, 'users', currentUser.uid, 'mealPlans', formatted);
        const cached = await getDoc(mealDocRef);

        if (cached.exists()) {
          weekPlans[formatted] = cached.data().plan;
        } else {
          const plan = await generateMealPlan(userProfile);
          weekPlans[formatted] = plan;
          await setDoc(mealDocRef, {
            plan,
            createdAt: new Date().toISOString(),
          });
        }
      }

      const todayFormatted = format(today, 'yyyy-MM-dd');
      setMealPlan(weekPlans[todayFormatted]); // Show today's by default

    } catch (err) {
      console.error('7-Day plan error:', err);
      setMealPlan(null);
    } finally {
      setLoading(false);
    }
  };

  fetchOrGenerateWeekPlan();
}, []);

const loadMealPlan = async (targetDate = selectedDate) => {
  const userId = getAuth().currentUser.uid;
  const dateKey = format(targetDate, 'yyyy-MM-dd');
  const docRef = doc(db, 'users', userId, 'mealPlans', dateKey); // NOTE: this was 'meals' in old version, fix if needed
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    setMealPlan(docSnap.data().plan);
    setSelectedDate(targetDate); // 👈 update UI selection
  } else {
    setMealPlan(null);
  }
};


const renderMeal = (mealType, items) => {
  const item = items[0]; // only show first item
  return (
    <TouchableOpacity
      style={styles.mealCard}
      onPress={() => navigation.navigate('CachedFoodsScreen', { mealType })}
    >
      <Image source={{ uri: item?.image || 'https://via.placeholder.com/80' }} style={styles.mealImage} />
      <View style={{ flex: 1 }}>
        <Text style={styles.mealType}>{mealType}</Text>
        <Text style={styles.mealDesc}>{item?.name || 'No meal available'}</Text>

        {(item?.calories !== undefined || item?.protein !== undefined || item?.carbs !== undefined || item?.fats !== undefined) && (
          <View style={styles.nutritionRow}>
            <Text style={styles.nutrientText}>Calories: {item.calories ?? 0} kcal</Text>
            <Text style={styles.nutrientText}>Protein: {item.protein ?? 0} g</Text>
            <Text style={styles.nutrientText}>Carbs: {item.carbs ?? 0} g</Text>
            <Text style={styles.nutrientText}>Fats: {item.fats ?? 0} g</Text>
          </View>
        )}

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.viewBtn}
            onPress={() => navigation.navigate('Recipe', { query: item?.name })}
          >
            <Text style={styles.btnText}>View Recipe</Text>
          </TouchableOpacity>
        </View>
      </View>
      <Feather name="check-square" size={24} color="#6C63FF" />

    </TouchableOpacity>
  );
};

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#6C63FF" />
        <Text style={{ marginTop: 12, color: '#6C63FF' }}>Generating meal plan...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.dateBar}>
  <Ionicons name="calendar-outline" size={20} color="#fff" />

  <Text style={styles.dateText}>
    Today: {format(new Date(), 'EEEE, dd MMMM yyyy')}
  </Text>
</View>


      <View style={styles.weekScroll}>
{weekDays.map((day, i) => {
  const date = new Date();
  date.setDate(new Date().getDate() + i);
  const dateKey = format(date, 'yyyy-MM-dd');
  const isSelected = format(selectedDate, 'yyyy-MM-dd') === dateKey;

  return (
    <TouchableOpacity
      key={i}
      style={[styles.dayCircle, isSelected && styles.dayCircleSelected]}
      onPress={async () => {
        setLoading(true);
        const auth = getAuth();
        const user = auth.currentUser;
        const mealDocRef = doc(db, 'users', user.uid, 'mealPlans', dateKey);
        const snap = await getDoc(mealDocRef);
        if (snap.exists()) {
          setMealPlan(snap.data().plan);
          setSelectedDate(date);
        } else {
          setMealPlan(null);
        }
        setLoading(false);
      }}
    >
      <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>{day}</Text>
      <Text style={[styles.dateLabel, isSelected && styles.dayTextSelected]}>
        {format(date, 'dd MMM')}
      </Text>
    </TouchableOpacity>
  );
})}



      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 80 }}>

{mealPlan && Object.values(mealPlan).some(items => items.length > 0) ? (
  ['breakfast', 'lunch', 'dinner', 'snacks'].map(type =>
    mealPlan[type] && mealPlan[type].length > 0 ? (
      <View key={type}>{renderMeal(type, mealPlan[type])}</View>
    ) : null
  )
) : (
  <Text>No suitable meals</Text>
)}


  <Button
  title="Adjust Meal Plan"
  onPress={() =>
    navigation.navigate('AdjustMealPlan', {
      onMealAdded: loadMealPlan // it now expects a date
    })
  }
/>

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
  container: { flex: 1, backgroundColor: '#f0efff' },
  dateBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6C63FF',
    padding: 12,
    paddingHorizontal: 20,
  },
  dateText: { color: 'white', fontSize: 16, marginLeft: 10 },
  weekScroll: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 10,
    backgroundColor: '#ddd0ff',
  },
  dayCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  dayText: { color: '#6C63FF', fontWeight: '600' },
  scroll: { padding: 16 },
  mealCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    elevation: 3,
  },
  mealImage: { width: 80, height: 80, borderRadius: 10, marginRight: 12 },
  mealType: { fontSize: 16, fontWeight: 'bold' },
  mealDesc: { color: '#555', marginBottom: 8 },
  buttonRow: { flexDirection: 'row', gap: 6 },
  viewBtn: {
    backgroundColor: '#6C63FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  btnText: { color: 'white', fontSize: 12 },
  adjustBtn: {
    marginTop: 20,
    backgroundColor: '#6C63FF',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  adjustText: { color: 'white', fontSize: 16 },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0efff',
  },
nutritionRow: {
  marginTop: 6,
  flexDirection: 'column',
  gap: 2,
},
nutrientText: {
  fontSize: 12,
  color: '#555',
},
bottomBar: {
  flexDirection: 'row',
  justifyContent: 'space-around',
  alignItems: 'center',
  paddingVertical: 10,
  backgroundColor: '#fff',
  borderTopWidth: 1,
  borderColor: '#ddd',
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
},

navItem: {
  alignItems: 'center',
  justifyContent: 'center',
  paddingVertical: 4, // add a bit of breathing room
},


navText: {
  fontSize: 12,
  color: '#6C63FF',
},
dayCircleSelected: {
  backgroundColor: '#6C63FF',
  borderRadius: 20,
  paddingHorizontal: 10,
  paddingVertical: 6,
},

dayTextSelected: {
  color: '#fff',
  fontWeight: 'bold',
},
dateLabel: {
  fontSize: 12,
  color: '#6C63FF',
  marginTop: 2,
},


});
