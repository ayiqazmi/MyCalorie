//AdjustMealPlan.jsx
import React, { useState } from 'react';
import { View, Text, Modal, Button, StyleSheet, TouchableOpacity, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { getAuth } from 'firebase/auth';
import {  doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase-config';
import { format } from 'date-fns';
import { askMealAI } from '../utils/askMealAI';
import { ImageBackground } from 'react-native';
import background from '../assets/background.png'; // ✅ Add your background
import Toast from 'react-native-toast-message';


export default function AdjustMealPlanScreen({ navigation, route }) {
  const { onMealAdded } = route.params || {};
  const [prompt, setPrompt] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modal-related states
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [mealType, setMealType] = useState('breakfast');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleAskAI = async () => {
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

    const date = new Date().toISOString().split("T")[0];
    const mealDocRef = doc(db, "users", currentUser.uid, "meals", date);

    let totalCalories = 0;

    const unsubscribe = onSnapshot(mealDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const mealsData = docSnap.data();
        let total = 0;
        Object.values(mealsData).forEach(mealType => {
          total += mealType.totalCalories || 0;
        });
        totalCalories = total;
       
      } else {
        totalCalories = 0;
      
      }
    });

    setLoading(true);

    // Call askMealAI with structured params
    const meals = await askMealAI({
      mealType: 'All', // or 'breakfast', 'dinner' as needed
      allergies: userProfile.allergies,
      healthConditions: userProfile.healthComplications,
      targetCalories: userProfile.caloriesGoal,
      caloriesConsumed: totalCalories
    });

    console.log('[AdjustMealPlan] AI Results:', meals);
    setResults(meals);
    setLoading(false);
  };

  const handleMealPress = (meal) => {
    setSelectedMeal(meal);
    setModalVisible(true);
  };

  const handleSaveToPlan = async () => {
    const userId  = getAuth().currentUser.uid;
    const dateKey = format(selectedDate, 'yyyy-MM-dd');

    try {
      await setDoc(
        doc(db, 'users', userId, 'mealPlans', dateKey),
        {
          [mealType]: {
            ...selectedMeal,
            addedAt: new Date().toISOString(),
          },
        },
        { merge: true }
      );

      // 🔔 Show toast **before** navigation so user sees it
      Toast.show({
        type: 'success',
        text1: 'Meal Updated',
        text2: 'Your new meal has been saved 🍽️',
      });

      // Short delay keeps the toast on screen long enough
      setTimeout(() => {
        navigation.navigate({
          name: 'MealPlan',
          params: {
            updatedMeal: selectedMeal,
            updatedMealType: mealType,
            updatedDate: dateKey,
          },
          merge: true,
        });
      }, 300);   // 250 ms feels snappier but still shows toast

    } catch (err) {
      console.error('Error saving meal:', err);
      Toast.show({
        type: 'error',
        text1: 'Save failed',
        text2: 'Please try again',
      });
    }
  };




return (
  <ImageBackground source={background} style={{ flex: 1 }} resizeMode="cover">
    <View style={styles.overlay}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>🎯 Ask AI to Adjust Meal Plan</Text>

        <TextInput
          style={styles.input}
          placeholder="e.g. breakfast under 100 calories made of fruits"
          placeholderTextColor="#999"
          value={prompt}
          onChangeText={setPrompt}
          multiline
        />

        <TouchableOpacity
          style={[styles.askButton, !prompt.trim() && styles.disabledButton]}
          onPress={handleAskAI}
          disabled={!prompt.trim()}
        >
          <Text style={styles.askText}>Ask AI</Text>
        </TouchableOpacity>

        {loading && (
          <ActivityIndicator style={{ marginTop: 20 }} size="large" color="#6C63FF" />
        )}

        {results.length > 0 && (
          <Text style={styles.resultTitle}>🍽️ Results:</Text>
        )}

        {results.map((meal, index) => (
          <TouchableOpacity key={index} style={styles.card} onPress={() => handleMealPress(meal)}>
            <Text style={styles.name}>{meal.name}</Text>
            <Text style={styles.nutrient}>Calories: {meal.calories}</Text>
            <Text style={styles.nutrient}>Protein: {meal.protein}g</Text>
            <Text style={styles.nutrient}>Carbs: {meal.carbs}g</Text>
            <Text style={styles.nutrient}>Fat: {meal.fat}g</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Assign "{selectedMeal?.name}"</Text>

            <Text style={styles.label}>Meal Type:</Text>
            <Picker selectedValue={mealType} onValueChange={setMealType}>
              <Picker.Item label="Breakfast" value="breakfast" />
              <Picker.Item label="Lunch" value="lunch" />
              <Picker.Item label="Dinner" value="dinner" />
              <Picker.Item label="Snacks" value="snacks" />
            </Picker>

            <Text style={styles.label}>Select Date:</Text>
            <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateBtn}>
              <Text style={styles.dateText}>{format(selectedDate, 'yyyy-MM-dd')}</Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="default"
                onChange={(e, d) => {
                  setShowDatePicker(false);
                  if (d) setSelectedDate(d);
                }}
              />
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveToPlan} style={styles.saveBtn}>
                <Text style={styles.saveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  </ImageBackground>
);

}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 100,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#6C63FF',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    borderColor: '#ccc',
    borderWidth: 1,
    minHeight: 60,
    marginBottom: 12,
    textAlignVertical: 'top',
  },
  askButton: {
    backgroundColor: '#6C63FF',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#aaa',
  },
  askText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 24,
    marginBottom: 12,
    color: '#333',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#333',
  },
  nutrient: {
    fontSize: 13,
    color: '#555',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    width: '90%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 14,
    color: '#6C63FF',
  },
  label: {
    marginTop: 12,
    marginBottom: 6,
    fontWeight: '600',
    color: '#444',
  },
  dateBtn: {
    backgroundColor: '#eee',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  dateText: {
    fontSize: 14,
    color: '#333',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  cancelBtn: {
    backgroundColor: '#ccc',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  cancelText: {
    color: '#fff',
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: '#6C63FF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  saveText: {
    color: '#fff',
    fontWeight: '600',
  },
});

