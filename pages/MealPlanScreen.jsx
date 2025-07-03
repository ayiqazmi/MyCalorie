import React, { useState, useEffect, useCallback, useLayoutEffect} from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator, Button, ImageBackground } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { getAuth } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase-config';
import { format } from 'date-fns';
import { generateMealPlan } from '../utils/generateMealPlan';
import background from '../assets/background.png'; // ✅ Use your actual background image
import { LinearGradient } from 'expo-linear-gradient';

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function MealPlanScreen({ route, navigation }) {
  const [mealPlan, setMealPlan] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  //const navigation = useNavigation();

    useLayoutEffect(() => {
    navigation.setOptions({ title: 'Your Meal Plan' });
  }, [navigation]);

  
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
          const { plan, createdAt } = await generateMealPlan(userProfile, targetDate.getTime());
          await setDoc(mealDocRef, { plan, createdAt });
          weekPlans[formatted] = plan;
        }
      }

      const todayFormatted = format(today, 'yyyy-MM-dd');
      setMealPlan(weekPlans[todayFormatted]);
    } catch (err) {
      console.error('Failed to load/generate meal plans:', err);
      setMealPlan(null);
    } finally {
      setLoading(false);
    }
  };

  fetchOrGenerateWeekPlan();
}, []);


const regenerateTodayPlan = async () => {
  setLoading(true);
  try {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const today = new Date();
    const dateKey = format(today, 'yyyy-MM-dd');
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

    const { plan, createdAt } = await generateMealPlan(userProfile, Date.now());
await setDoc(doc(db, 'users', currentUser.uid, 'mealPlans', dateKey), {
  plan,
  createdAt,
});
setMealPlan(plan);

    setSelectedDate(today);
  } catch (error) {
    console.error('Error regenerating plan:', error);
  } finally {
    setLoading(false);
  }
};


const fetchOrGenerateMealPlan = async (targetDate = selectedDate) => {
  setLoading(true);
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

    const dateKey = format(targetDate, 'yyyy-MM-dd');
    const mealDocRef = doc(db, 'users', currentUser.uid, 'mealPlans', dateKey);
    const docSnap = await getDoc(mealDocRef);

    if (docSnap.exists()) {
      setMealPlan(docSnap.data().plan);
    } else {
      const { plan, createdAt } = await generateMealPlan(userProfile, targetDate.getTime());
      await setDoc(mealDocRef, { plan, createdAt });
      setMealPlan(plan);
    }

    setSelectedDate(targetDate);
  } catch (err) {
    console.error('Failed to fetch/generate meal plan for day:', err);
    setMealPlan(null);
  } finally {
    setLoading(false);
  }
};

useFocusEffect(
  useCallback(() => {
    fetchOrGenerateMealPlan(); // Always fetch latest when screen is focused
  }, [])
);




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
  <ImageBackground source={background} style={styles.bg} resizeMode="cover">
    <View style={{ flex: 1 }}>
    <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }} // enough space for bottom bar
        style={{ flexGrow: 1 }}
      >
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
                onPress={() => fetchOrGenerateMealPlan(date)}

              >
                <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>{day}</Text>
                <Text style={[styles.dateLabel, isSelected && styles.dayTextSelected]}>
                  {format(date, 'dd MMM')}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#6C63FF" />
            <Text style={{ marginTop: 10, color: '#6C63FF' }}>Generating meal plan...</Text>
          </View>
        ) : mealPlan && Object.values(mealPlan).some(items => items.length > 0) ? (
          ['breakfast', 'lunch', 'dinner', 'snacks'].map(type =>
            mealPlan[type] && mealPlan[type].length > 0 ? (
              <View key={type}>{renderMeal(type, mealPlan[type])}</View>
            ) : null
          )
        ) : (
          <Text style={styles.noMealText}>No suitable meals for this day.</Text>
        )}

        <TouchableOpacity style={styles.adjustBtn} onPress={() => navigation.navigate('AdjustMealPlan')}>
          <Text style={styles.adjustText}>Adjust Meal Plan</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.adjustBtn} onPress={regenerateTodayPlan}>
  <Text style={styles.adjustText}>Regenerate Today’s Plan</Text>
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
  <TouchableOpacity style={styles.navItem}>
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

    </View>
  </ImageBackground>
);

}


const styles = StyleSheet.create({
  bg: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  dateBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6C63FF',
    padding: 14,
    paddingHorizontal: 20,
  },
  dateText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 10,
    fontWeight: '500',
  },
  weekScroll: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    backgroundColor: '#eee8ff',
  },
  dayCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  dayCircleSelected: {
    backgroundColor: '#6C63FF',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  dayText: {
    color: '#6C63FF',
    fontWeight: '600',
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
  mealCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 14,
    marginVertical: 8,
    marginHorizontal: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  mealImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 14,
  },
  mealType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  mealDesc: {
    color: '#555',
    marginBottom: 6,
    fontSize: 14,
  },
  nutritionRow: {
    marginTop: 4,
  },
  nutrientText: {
    fontSize: 12,
    color: '#555',
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  viewBtn: {
    backgroundColor: '#6C63FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  btnText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  adjustBtn: {
    backgroundColor: '#6C63FF',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  adjustText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  noMealText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    color: '#888',
  },
  loaderContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
bottomBar: {
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  height: 70,
  flexDirection: 'row',
  justifyContent: 'space-around',
  alignItems: 'center',
  borderTopLeftRadius: 20,
  borderTopRightRadius: 20,
  overflow: 'hidden',
},

navItem: {
  alignItems: 'center',
  justifyContent: 'center',
},

navTextWhite: {
  fontSize: 12,
  marginTop: 4,
  color: '#fff',
},

});
