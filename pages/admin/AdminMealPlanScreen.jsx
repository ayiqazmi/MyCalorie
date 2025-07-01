// pages/admin/AdminMealPlanScreen.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator, Button } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRoute, useNavigation } from '@react-navigation/native';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase-config';
import { format } from 'date-fns';

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function AdminMealPlanScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { userId } = route.params;

  const [userName, setUserName] = useState('');
  const [mealPlan, setMealPlan] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchTodayPlan();
    }, [userId])
  );

  const fetchTodayPlan = async () => {
    try {
      setLoading(true);
      const userDocRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userDocRef);
      if (!userSnap.exists()) return;

      const userData = userSnap.data();
      setUserName(userData.username || 'User');

      const today = format(new Date(), 'yyyy-MM-dd');
      const mealDocRef = doc(db, 'users', userId, 'mealPlans', today);
      const snap = await getDoc(mealDocRef);
      if (snap.exists()) {
        setMealPlan(snap.data().plan);
      } else {
        setMealPlan(null);
      }
    } catch (err) {
      console.error('Fetch plan error:', err);
      setMealPlan(null);
    } finally {
      setLoading(false);
    }
  };

  const renderMeal = (mealType, items) => {
    if (!Array.isArray(items) || items.length === 0 || !items[0]) return null;
    const item = items[0];

    return (
      <View style={styles.mealCard}>
        <Image source={{ uri: item?.image || 'https://via.placeholder.com/80' }} style={styles.mealImage} />
        <View style={{ flex: 1 }}>
          <Text style={styles.mealType}>{mealType}</Text>
          <Text style={styles.mealDesc}>{item?.name || 'No meal available'}</Text>
          <View style={styles.nutritionRow}>
            <Text style={styles.nutrientText}>Calories: {item.calories ?? 0} kcal</Text>
            <Text style={styles.nutrientText}>Protein: {item.protein ?? 0} g</Text>
            <Text style={styles.nutrientText}>Carbs: {item.carbs ?? 0} g</Text>
            <Text style={styles.nutrientText}>Fats: {item.fats ?? 0} g</Text>
          </View>
          <TouchableOpacity
            style={styles.viewBtn}
            onPress={() => navigation.navigate('Recipe', { query: item?.name })}
          >
            <Text style={styles.btnText}>View Recipe</Text>
          </TouchableOpacity>
        </View>
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
    <View style={styles.container}>
      <Text style={styles.userHeading}>{userName}'s Meal Plan</Text>

      <View style={styles.dateBar}>
        <Ionicons name="calendar-outline" size={20} color="#fff" />
        <Text style={styles.dateText}>Today: {format(new Date(), 'EEEE, dd MMMM yyyy')}</Text>
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
                const mealDocRef = doc(db, 'users', userId, 'mealPlans', dateKey);
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
          <Text style={{ color: '#ccc', textAlign: 'center' }}>No suitable meals</Text>
        )}

        <Button
          title="Adjust Meal Plan"
          onPress={() =>
            navigation.navigate('AdminAdjustMealPlan', {
              userId,
              selectedDate: selectedDate.toISOString(),
            })
          }
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E2A38',
  },
  userHeading: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  dateBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6C63FF',
    padding: 12,
    paddingHorizontal: 20,
  },
  dateText: {
    color: 'white',
    fontSize: 16,
    marginLeft: 10,
  },
  weekScroll: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 10,
    backgroundColor: '#2A3C53',
  },
  dayCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  dayText: {
    color: '#A8C1FF',
    fontWeight: '600',
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
    color: '#A8C1FF',
    marginTop: 2,
  },
  scroll: {
    padding: 16,
  },
  mealCard: {
    flexDirection: 'row',
    backgroundColor: '#2E3C50',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    elevation: 2,
    borderLeftWidth: 3,
    borderColor: '#6C63FF',
  },
  mealImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginRight: 12,
  },
  mealType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  mealDesc: {
    color: '#cccccc',
    marginBottom: 8,
  },
  viewBtn: {
    backgroundColor: '#6C63FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  btnText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E2A38',
  },
  nutritionRow: {
    marginTop: 6,
  },
  nutrientText: {
    fontSize: 12,
    color: '#cccccc',
  },
});
