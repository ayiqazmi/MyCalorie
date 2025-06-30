//AdjustMealPlan.jsx
import React, { useState } from 'react';
import { View, Text, Modal, Button, StyleSheet, TouchableOpacity, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { getAuth } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase-config';
import { format } from 'date-fns';
import { askMealAI } from '../utils/askMealAI';

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
    setLoading(true);
    const meals = await askMealAI(prompt);
    console.log('[AdjustMealPlan] AI Results:', meals);
    setResults(meals);
    setLoading(false);
  };

  const handleMealPress = (meal) => {
    setSelectedMeal(meal);
    setModalVisible(true);
  };

const handleSaveToPlan = async () => {
  const userId = getAuth().currentUser.uid;
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

    setModalVisible(false);

    // ✅ This is enough — it updates existing MealPlan route
    navigation.navigate({
      name: 'MealPlan',
      params: {
        updatedMeal: selectedMeal,
        updatedMealType: mealType,
        updatedDate: format(selectedDate, 'yyyy-MM-dd') // ✅ safe string
      },
      merge: true,
    });

  } catch (err) {
    console.error('Error saving meal:', err);
  }
};





  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>🎯 Ask AI to Adjust Meal Plan</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. breakfast under 100 calories made of fruits"
        value={prompt}
        onChangeText={setPrompt}
        multiline
      />
      <Button title="Ask AI" onPress={handleAskAI} disabled={!prompt.trim()} />
      {loading && <ActivityIndicator style={{ marginTop: 20 }} size="large" color="#6C63FF" />}

      {results.length > 0 && (
        <Text style={styles.resultTitle}>🍽️ Results:</Text>
      )}

      {results.map((meal, index) => (
        <TouchableOpacity key={index} style={styles.card} onPress={() => handleMealPress(meal)}>
          <Text style={styles.name}>{meal.name}</Text>
          <Text>Calories: {meal.calories}</Text>
          <Text>Protein: {meal.protein}g</Text>
          <Text>Carbs: {meal.carbs}g</Text>
          <Text>Fat: {meal.fat}g</Text>
        </TouchableOpacity>
      ))}

      {/* Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
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
            <Button title={format(selectedDate, 'yyyy-MM-dd')} onPress={() => setShowDatePicker(true)} />
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
              <Button title="Cancel" onPress={() => setModalVisible(false)} color="#aaa" />
              <Button title="Save" onPress={handleSaveToPlan} />
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  input: {
    borderColor: '#ccc', borderWidth: 1, borderRadius: 8,
    padding: 12, marginBottom: 12, textAlignVertical: 'top', minHeight: 60
  },
  resultTitle: { fontSize: 16, fontWeight: 'bold', marginTop: 20, marginBottom: 10 },
  card: { backgroundColor: '#f2f2f2', padding: 12, borderRadius: 8, marginBottom: 10 },
  name: { fontWeight: 'bold', fontSize: 16, marginBottom: 4 },

  modalContainer: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center'
  },
  modalContent: {
    backgroundColor: 'white', padding: 20, borderRadius: 12, width: '90%'
  },
  modalTitle: {
    fontSize: 18, fontWeight: 'bold', marginBottom: 10
  },
  label: {
    marginTop: 10, marginBottom: 5, fontWeight: '600'
  },
  modalButtons: {
    marginTop: 20, flexDirection: 'row', justifyContent: 'space-between'
  }
});
