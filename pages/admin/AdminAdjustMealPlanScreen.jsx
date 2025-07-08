import React, { useState } from 'react';
import {
  View, Text, Modal, StyleSheet, TouchableOpacity, TextInput, ScrollView,
  ActivityIndicator, ImageBackground
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { getAuth } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../config/firebase-config';
import { format } from 'date-fns';
import { askMealAI } from '../../utils/askMealAI';
import background from '../../assets/background.png';
import Toast from 'react-native-toast-message';

export default function AdminAdjustMealPlanScreen({ navigation, route }) {
  const { targetUserId, selectedDate: initialDate, mealType: initialMealType } = route.params || {};
  const [prompt, setPrompt] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [mealType, setMealType] = useState(initialMealType || 'breakfast');
  const [selectedDate, setSelectedDate] = useState(initialDate ? new Date(initialDate) : new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  if (!targetUserId) {
    Toast.show({ type: 'error', text1: 'Missing user ID', text2: 'Cannot adjust meal without user ID.' });
    navigation.goBack();
    return null;
  }

  const handleAskAI = async () => {
    try {
      const userDocRef = doc(db, 'users', targetUserId);
      const userSnap = await getDoc(userDocRef);
      if (!userSnap.exists()) throw new Error('User not found');

      const userData = userSnap.data();
      const health = userData.healthDetails || {};
      const allergies = Array.isArray(health.allergies) ? health.allergies : [];
      const healthConditions = Array.isArray(health.healthComplications) ? health.healthComplications : [];
      const caloriesGoal = Number(health.targetCalories) || 2000;

      const dateKey = format(selectedDate, 'yyyy-MM-dd');
      const mealDocRef = doc(db, 'users', targetUserId, 'meals', dateKey);

      let totalCalories = 0;
      const docSnap = await getDoc(mealDocRef);
      if (docSnap.exists()) {
        const mealsData = docSnap.data();
        totalCalories = Object.values(mealsData).reduce((acc, meal) => acc + (meal.totalCalories || 0), 0);
      }

      setLoading(true);

      const meals = await askMealAI({
        mealType,
        allergies,
        healthConditions,
        targetCalories: caloriesGoal,
        caloriesConsumed: totalCalories,
      });

      setResults(meals);
    } catch (err) {
      console.error('[AdminAskAI] Error:', err);
      Toast.show({
        type: 'error',
        text1: 'AI Error',
        text2: 'Unable to fetch AI suggestions',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMealPress = (meal) => {
    setSelectedMeal(meal);
    setModalVisible(true);
  };

  const handleSaveToPlan = async () => {
    const admin = getAuth().currentUser;
    const dateKey = format(selectedDate, 'yyyy-MM-dd');

    try {
      await setDoc(
        doc(db, 'users', targetUserId, 'mealPlans', dateKey),
        {
          [mealType]: {
            ...selectedMeal,
            addedAt: new Date().toISOString(),
          },
          updatedBy: {
            uid: admin.uid,
            displayName: admin.displayName || 'Admin',
          },
        },
        { merge: true }
      );

      Toast.show({
        type: 'success',
        text1: 'Meal Updated',
        text2: 'Meal saved for user 🍽️',
      });

      setTimeout(() => {
        navigation.goBack();
      }, 300);
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
      <View style={styles.overlay}>
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.title}>🧑‍💼 AI Suggestion for User</Text>

          <TextInput
            style={styles.input}
            placeholder="e.g. low carb lunch under 400 calories"
            placeholderTextColor="#999"
            value={prompt}
            onChangeText={setPrompt}
            multiline
          />

          <TouchableOpacity style={styles.askButton} onPress={handleAskAI}>
            <Text style={styles.askText}>Ask AI</Text>
          </TouchableOpacity>

          {loading && <ActivityIndicator style={{ marginTop: 20 }} size="large" color="#6C63FF" />}

          {results.length > 0 && <Text style={styles.resultTitle}>🍽️ Suggestions:</Text>}

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
  );
}

const styles = StyleSheet.create({
container: { padding: 20, paddingBottom: 100 },
title: { fontSize: 22, fontWeight: '700', color: '#ffffff', marginBottom: 16 },
input: {
  backgroundColor: '#2E3C50',
  borderRadius: 10,
  padding: 12,
  fontSize: 14,
  borderColor: '#6C63FF',
  borderWidth: 1,
  minHeight: 60,
  marginBottom: 12,
  color: '#fff',
  textAlignVertical: 'top',
},
card: {
  backgroundColor: '#2E3C50',
  borderRadius: 14,
  padding: 14,
  marginBottom: 12,
  borderLeftWidth: 4,
  borderColor: '#6C63FF',
},
name: { fontSize: 16, fontWeight: '600', marginBottom: 4, color: '#fff' },
nutrient: { fontSize: 13, color: '#ccc' },
askText: { color: '#fff', fontSize: 15, fontWeight: '600' },
askButton: {
  backgroundColor: '#6C63FF',
  paddingVertical: 10,
  borderRadius: 10,
  alignItems: 'center',
},
resultTitle: { fontSize: 16, fontWeight: '600', marginTop: 24, marginBottom: 12, color: '#fff' },

  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: 'white', padding: 20, borderRadius: 16, width: '90%' },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 14, color: '#6C63FF' },
  label: { marginTop: 12, marginBottom: 6, fontWeight: '600', color: '#444' },
  dateBtn: { backgroundColor: '#eee', padding: 10, borderRadius: 8, alignItems: 'center' },
  dateText: { fontSize: 14, color: '#333' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 24 },
  cancelBtn: { backgroundColor: '#ccc', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  cancelText: { color: '#fff', fontWeight: '600' },
  saveBtn: { backgroundColor: '#6C63FF', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  saveText: { color: '#fff', fontWeight: '600' },
});
