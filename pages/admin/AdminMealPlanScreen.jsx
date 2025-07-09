import React, { useState, useEffect, useLayoutEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, ImageBackground,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { getAuth } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../config/firebase-config';
import { format } from 'date-fns';
import background from '../../assets/background.png';
import { LinearGradient } from 'expo-linear-gradient';
import MealImage from '../../utils/MealImage';
import Toast from 'react-native-toast-message';

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function AdminMealPlanScreen({ route, navigation }) {
  const { targetUserId } = route.params || {};
  const isAdminView = !!targetUserId;

  const [mealPlan, setMealPlan] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [updatedBy, setUpdatedBy] = useState(null);

  const userId = targetUserId || getAuth().currentUser?.uid;

  useLayoutEffect(() => {
    navigation.setOptions({ title: isAdminView ? 'User Meal Plan' : 'Your Meal Plan' });
  }, [navigation]);

const fetchMealPlanForDate = async (targetDate) => {
  setLoading(true);
  try {
    const dateKey = format(targetDate, 'yyyy-MM-dd');
    const mealDocRef = doc(db, 'users', userId, 'mealPlans', dateKey);
    const docSnap = await getDoc(mealDocRef);

    if (docSnap.exists()) {
  const data = docSnap.data();
  const original = data.plan?.original || {};
  const adjusted = data.plan?.adjusted || {};
  const mergedPlan = {};

  // combine original + adjusted for display
  for (const mealType of ['breakfast', 'lunch', 'dinner', 'snacks']) {
    mergedPlan[mealType] = {
      original: original[mealType] || [],
      adjusted: adjusted[mealType] || [],
    };
  }

  setMealPlan(mergedPlan);
  setUpdatedBy(data.updatedBy || null);
}
 else {
      setMealPlan(null);
      setUpdatedBy(null);
    }

    setSelectedDate(targetDate);
  } catch (error) {
    console.error('Error fetching meal plan:', error);
    setMealPlan(null);
  } finally {
    setLoading(false);
  }
};


useFocusEffect(
  useCallback(() => {
    fetchMealPlanForDate(selectedDate);
  }, [selectedDate])
);

  const regenerateMealPlan = async () => {
    setLoading(true);
    try {
      const auth = getAuth();
      const adminUser = auth.currentUser;
      const adminName = adminUser?.displayName || 'Admin';

      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) throw new Error('User doc missing');

      const userData = userDoc.data();
      const { generateMealPlan } = await import('../../utils/generateMealPlan');
      const { plan } = await generateMealPlan({
        allergies: userData.allergies || [],
        healthComplications: userData.healthComplications || [],
        healthGoal: userData.healthGoal || 'maintain',
        caloriesGoal: userData.targetCalories || 2000,
      }, selectedDate.getTime());

      const dateKey = format(selectedDate, 'yyyy-MM-dd');
      const mealDocRef = doc(db, 'users', userId, 'mealPlans', dateKey);

      await setDoc(mealDocRef, {
  plan: {
    original: plan, // store AI-generated plan under `original`
  },
  createdAt: new Date().toISOString(),
  updatedBy: {
    uid: adminUser.uid,
    name: adminName,
    role: 'admin',
  },
});


      setMealPlan(plan);
      setUpdatedBy({ name: adminName, role: 'admin' });
      Toast.show({
        type: 'success',
        text1: 'Meal Plan Regenerated',
        text2: 'A new plan has been generated using AI',
      });
    } catch (error) {
      console.error('Failed to regenerate meal plan:', error);
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to regenerate plan.' });
    } finally {
      setLoading(false);
    }
  };

const renderMeal = (mealType, items) => {
  const original = items.original?.[0];
  const adjusted = items.adjusted?.[0];

  return (
    <View style={styles.mealSection}>
      <Text style={styles.mealTypeHeader}>
        {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
      </Text>

      {/* Original meal - CLICKABLE */}
      {original && (
        <TouchableOpacity
          style={styles.mealCard}
          onPress={() =>
            navigation.navigate('AdminAdjustMealPlan', {
              targetUserId,
              selectedDate: format(selectedDate, 'yyyy-MM-dd'),
              mealType,
            })
          }
        >
          <MealImage mealName={original.name} style={styles.mealImage} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.tagText, { color: 'green' }]}>Original Plan</Text>
            <Text style={styles.mealDesc}>{original.name}</Text>
            <View style={styles.nutritionRow}>
              <Text style={styles.nutrientText}>Calories: {original.calories ?? 0} kcal</Text>
              <Text style={styles.nutrientText}>Protein: {original.protein ?? 0} g</Text>
              <Text style={styles.nutrientText}>Carbs: {original.carbs ?? 0} g</Text>
              <Text style={styles.nutrientText}>Fats: {original.fat ?? 0} g</Text>
            </View>
          </View>
        </TouchableOpacity>
      )}

      {/* Adjusted meal - NOT clickable */}
      {adjusted && (
        <View style={styles.mealCard}>
          <MealImage mealName={adjusted.name} style={styles.mealImage} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.tagText, { color: 'red' }]}>Admin Adjusted</Text>
            <Text style={styles.mealDesc}>{adjusted.name}</Text>
            <View style={styles.nutritionRow}>
              <Text style={styles.nutrientText}>Calories: {adjusted.calories ?? 0} kcal</Text>
              <Text style={styles.nutrientText}>Protein: {adjusted.protein ?? 0} g</Text>
              <Text style={styles.nutrientText}>Carbs: {adjusted.carbs ?? 0} g</Text>
              <Text style={styles.nutrientText}>Fats: {adjusted.fat ?? 0} g</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};




  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#6C63FF" />
        <Text style={{ marginTop: 12, color: '#6C63FF' }}>Loading meal plan...</Text>
      </View>
    );
  }

  return (
  <View style={styles.bg}>

        <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
          <View style={styles.dateBar}>
            <Ionicons name="calendar-outline" size={20} color="#fff" />
            <Text style={styles.dateText}>
              Viewing: {format(selectedDate, 'EEEE, dd MMMM yyyy')}
            </Text>
          </View>

          {updatedBy?.role === 'admin' && (
  <Text style={styles.adminNote}>
    This plan was updated by admin: {updatedBy.name}
  </Text>
)}


          <View style={styles.weekScroll}>
            {weekDays.map((_, i) => {
              const date = new Date();
              date.setDate(new Date().getDate() + i);
              const dateKey = format(date, 'yyyy-MM-dd');
              const isSelected = format(selectedDate, 'yyyy-MM-dd') === dateKey;

              return (
                <TouchableOpacity
                  key={i}
                  style={[styles.dayCircle, isSelected && styles.dayCircleSelected]}
                  onPress={() => fetchMealPlanForDate(date)}
                >
                  <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>
                    {format(date, 'EEE')}
                  </Text>
                  <Text style={[styles.dateLabel, isSelected && styles.dayTextSelected]}>
                    {format(date, 'dd MMM')}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {mealPlan && Object.values(mealPlan).some(
  items => (items.original?.length || 0) > 0 || (items.adjusted?.length || 0) > 0
)
 ? (
            ['breakfast', 'lunch', 'dinner', 'snacks'].map(type =>
              (mealPlan[type]?.adjusted?.length > 0 || mealPlan[type]?.original?.length > 0)
 ? (
                <View key={type}>{renderMeal(type, mealPlan[type])}</View>
              ) : null
            )
          ) : (
            <Text style={styles.noMealText}>No meal plan found for this day.</Text>
          )}
        </ScrollView>
      </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#1E2A38' },

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
    backgroundColor: '#2E3C50',
    borderBottomWidth: 1,
    borderColor: '#444',
  },
  dayCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    borderRadius: 12,
  },
  dayCircleSelected: {
    backgroundColor: '#6C63FF',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  dayText: {
    color: '#ccc',
    fontWeight: '600',
    fontSize: 13,
  },
  dayTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  dateLabel: {
    fontSize: 11,
    color: '#aaa',
    marginTop: 2,
  },

  mealSection: {
    marginVertical: 16,
  },
  mealTypeHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginLeft: 20,
    marginBottom: 6,
  },

  mealCard: {
    flexDirection: 'row',
    backgroundColor: '#2E3C50',
    borderRadius: 16,
    padding: 14,
    marginVertical: 6,
    marginHorizontal: 16,
    alignItems: 'center',
    borderLeftWidth: 4,
    borderColor: '#6C63FF',
  },
  mealImage: {
    width: 70,
    height: 70,
    borderRadius: 10,
    marginRight: 14,
  },
  mealDesc: {
    color: '#ffffff',
    marginBottom: 6,
    fontSize: 14,
    fontWeight: '600',
  },
  nutritionRow: {
    marginTop: 2,
  },
  nutrientText: {
    fontSize: 12,
    color: '#aaaaaa',
  },
  tagText: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },

  noMealText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    color: '#888',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#1E2A38',
  },

  adjustBtn: {
    backgroundColor: '#6C63FF',
    marginHorizontal: 20,
    marginTop: 24,
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  adjustText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },

  adminNote: {
    color: 'red',
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 10,
  },
});

