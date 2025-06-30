import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase-config.js';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';

export default function HealthDetails({ navigation }) {
  const [gender, setGender] = useState('');
  const [birthday, setBirthday] = useState('');
  const [age, setAge] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [bmi, setBmi] = useState(null);
  const [healthComplications, setHealthComplications] = useState([]);
  const [allergies, setAllergies] = useState([]);
  const [currentHealthComp, setCurrentHealthComp] = useState('');
  const [currentAllergy, setCurrentAllergy] = useState('');
  const [goal, setGoal] = useState('');
const [activityLevel, setActivityLevel] = useState('');



  // Calculate age
  const calculateAge = (birthDate) => {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  // Calculate BMI
  const calculateBmi = (h, w) => {
    const heightMeters = parseFloat(h) / 100;
    const weightKg = parseFloat(w);
    if (!isNaN(heightMeters) && !isNaN(weightKg) && heightMeters > 0) {
      return (weightKg / (heightMeters * heightMeters)).toFixed(2);
    }
    return null;
  };

  // Fetch data
  useEffect(() => {
    const fetchHealthData = async () => {
      const user = auth.currentUser;
      if (user) {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          const health = data.healthDetails || {};
setGender(health.gender || '');
setBirthday(health.birthday || '');
setHealthComplications(health.healthComplications || []);
setAllergies(health.allergies || []);
setHeight(health.height || '');
setWeight(health.weight || '');

if (health.birthday) setAge(calculateAge(health.birthday));
if (health.height && health.weight) setBmi(calculateBmi(health.height, health.weight));

if (health.goal) setGoal(health.goal);
if (health.activityLevel) setActivityLevel(health.activityLevel);



          if (data.birthday) setAge(calculateAge(data.birthday));
          if (data.height && data.weight) setBmi(calculateBmi(data.height, data.weight));
        }
      }
    };
    fetchHealthData();
  }, []);

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const dateStr = selectedDate.toISOString().split('T')[0];
      setBirthday(dateStr);
      setAge(calculateAge(dateStr));
    }
  };

  const handleHeightChange = (value) => {
    setHeight(value);
    if (value && weight) setBmi(calculateBmi(value, weight));
  };

  const handleWeightChange = (value) => {
    setWeight(value);
    if (height && value) setBmi(calculateBmi(height, value));
  };

  const handleAddHealthComp = () => {
    if (currentHealthComp.trim()) {
      setHealthComplications([...healthComplications, currentHealthComp.trim()]);
      setCurrentHealthComp('');
    }
  };

  const handleRemoveHealthComp = (index) => {
    const updated = [...healthComplications];
    updated.splice(index, 1);
    setHealthComplications(updated);
  };

  const handleAddAllergy = () => {
    if (currentAllergy.trim()) {
      setAllergies([...allergies, currentAllergy.trim()]);
      setCurrentAllergy('');
    }
  };

  const handleRemoveAllergy = (index) => {
    const updated = [...allergies];
    updated.splice(index, 1);
    setAllergies(updated);
  };

  const calculateCaloriesFromHealthData = ({ gender, weight, height, age, activityLevel, goal }) => {
  const weightKg = parseFloat(weight);
  const heightCm = parseFloat(height);

  // Step 1: Calculate BMR
  let bmr;
  if (gender.toLowerCase() === "male") {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  } else {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  }

  // Step 2: Apply activity multiplier
  const activityFactors = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };
  const factor = activityFactors[activityLevel] || 1.2;
  const maintenanceCalories = Math.round(bmr * factor);

  // Step 3: Adjust based on goal
  let targetCalories = maintenanceCalories;
  if (goal === "lose") targetCalories -= 500;
  if (goal === "gain") targetCalories += 500;

  return {
    bmr: Math.round(bmr),
    maintenanceCalories,
    targetCalories,
  };
};


const handleSave = () => {
  const finalAge = birthday ? calculateAge(birthday) : null;
  const finalBmi = (height && weight) ? calculateBmi(height, weight) : null;

  const summaryMessage = `
Gender: ${gender}
Birthday: ${birthday}
Age: ${finalAge} years
Height: ${height} cm
Weight: ${weight} kg
BMI: ${finalBmi}
Goal: ${goal}
Activity Level: ${activityLevel}
Health Complications: ${healthComplications.join(', ') || "None"}
Allergies: ${allergies.join(', ') || "None"}
  `.trim();

  Alert.alert(
    "Confirm Health Details",
    summaryMessage,
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Confirm",
        onPress: () => handleFinalSave(finalAge, finalBmi),
      },
    ],
    { cancelable: true }
  );
};

const handleFinalSave = async (finalAge, finalBmi) => {
  const user = auth.currentUser;
  if (!user) return;

  const { bmr, maintenanceCalories, targetCalories } = calculateCaloriesFromHealthData({
    gender,
    weight,
    height,
    age: finalAge,
    activityLevel,
    goal,
  });

  const docRef = doc(db, 'users', user.uid);
  await updateDoc(docRef, {
    healthDetails: {
      gender,
      birthday,
      age: finalAge,
      height,
      weight,
      bmi: finalBmi,
      healthComplications,
      allergies,
      goal,
      activityLevel,
      bmr,
      maintenanceCalories,
      targetCalories,
    },
  });

  // Success popup explaining the calculation
  Alert.alert(
    "Target Calories Calculated",
    `✅ BMR (Basal Metabolic Rate): ${bmr} kcal/day
✅ Maintenance Calories (TDEE): ${maintenanceCalories} kcal/day
✅ Target Calories: ${targetCalories} kcal/day

This is calculated using the Mifflin-St Jeor Equation and adjusted based on your goal and activity level.`,
    [
      {
        text: "Got it!",
        onPress: () => {
          setAge(finalAge);
          setBmi(finalBmi);
          navigation.goBack();
        },
      },
    ]
  );
};



  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Health Details</Text>

      <Text style={styles.label}>Gender</Text>
      <View style={styles.pickerWrapper}>
        <Picker selectedValue={gender} onValueChange={setGender} style={styles.picker}>
          <Picker.Item label="Select gender" value="" />
          <Picker.Item label="Male" value="Male" />
          <Picker.Item label="Female" value="Female" />
        </Picker>
      </View>

      <Text style={styles.label}>Age</Text>
      <View style={styles.ageBox}>
        <Text style={styles.ageText}>{age !== null ? `${age} years` : "--"}</Text>
      </View>

      <TouchableOpacity onPress={() => setShowDatePicker(true)}>
        <Text style={styles.birthdayText}>{birthday ? `Birthday: ${birthday}` : 'Select Birthday'}</Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={birthday ? new Date(birthday) : new Date()}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}

      <Text style={styles.label}>Height (cm)</Text>
      <TextInput placeholder="Enter height" style={styles.input} value={height} onChangeText={handleHeightChange} keyboardType="numeric" />

      <Text style={styles.label}>Weight (kg)</Text>
      <TextInput placeholder="Enter weight" style={styles.input} value={weight} onChangeText={handleWeightChange} keyboardType="numeric" />

      <Text style={styles.label}>BMI</Text>
      <View style={styles.ageBox}>
        <Text style={styles.ageText}>{bmi !== null ? bmi : "--"}</Text>
      </View>

      <Text style={styles.label}>Health Complications</Text>
      <View style={styles.inputRow}>
        <TextInput placeholder="Add health complication" value={currentHealthComp} onChangeText={setCurrentHealthComp} style={styles.input} />
        <TouchableOpacity onPress={handleAddHealthComp} style={styles.addButton}>
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.chipContainer}>
        {healthComplications.map((item, index) => (
          <View key={index} style={styles.chip}>
            <Text style={styles.chipText}>{item}</Text>
            <TouchableOpacity onPress={() => handleRemoveHealthComp(index)}>
              <Ionicons name="close" size={16} color="white" />
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <Text style={styles.label}>Allergies</Text>
      <View style={styles.inputRow}>
        <TextInput placeholder="Add allergy" value={currentAllergy} onChangeText={setCurrentAllergy} style={styles.input} />
        <TouchableOpacity onPress={handleAddAllergy} style={styles.addButton}>
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.chipContainer}>
        {allergies.map((item, index) => (
          <View key={index} style={styles.chip}>
            <Text style={styles.chipText}>{item}</Text>
            <TouchableOpacity onPress={() => handleRemoveAllergy(index)}>
              <Ionicons name="close" size={16} color="white" />
            </TouchableOpacity>
          </View>
        ))}

      </View>

       <Text style={styles.label}>Goal</Text>
<View style={styles.pickerWrapper}>
  <Picker selectedValue={goal} onValueChange={setGoal} style={styles.picker}>
    <Picker.Item label="Select Goal" value="" />
    <Picker.Item label="Lose Weight" value="lose" />
    <Picker.Item label="Maintain Weight" value="maintain" />
    <Picker.Item label="Gain Weight" value="gain" />
  </Picker>
</View>

<Text style={styles.label}>Activity Level</Text>
<View style={styles.pickerWrapper}>
  <Picker selectedValue={activityLevel} onValueChange={setActivityLevel} style={styles.picker}>
    <Picker.Item label="Sedentary (little/no exercise)" value="sedentary" />
    <Picker.Item label="Lightly Active (Exercise 1–3x/week)" value="light" />
    <Picker.Item label="Moderately Active (Exercise 3–4x/week)" value="moderate" />
    <Picker.Item label="Very Active (Exercise 4–5x/week)" value="active" />
    <Picker.Item label="Extra Active (Very intense exercise everyday or physical job)" value="very_active" />
  </Picker>
</View>



      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#6C63FF' },
  label: { fontSize: 16, marginTop: 10, marginBottom: 4 },
  pickerWrapper: { borderWidth: 1, borderColor: '#ccc', borderRadius: 5, marginBottom: 10 },
  picker: { height: 48, width: '100%' },
  ageBox: { borderWidth: 1, borderColor: '#ccc', borderRadius: 5, padding: 12, marginBottom: 10 },
  ageText: { fontSize: 16, color: '#333' },
  birthdayText: { fontSize: 14, color: '#6C63FF', marginBottom: 10 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginVertical: 10, borderRadius: 5 },
  saveButton: { backgroundColor: '#6C63FF', padding: 15, borderRadius: 10, marginTop: 20, alignItems: 'center' },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  inputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  addButton: { backgroundColor: '#6C63FF', padding: 10, borderRadius: 5, marginLeft: 10 },
  addButtonText: { color: '#fff', fontWeight: 'bold' },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 },
  chip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#6C63FF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, margin: 4 },
  chipText: { color: '#fff', marginRight: 6 },
});
// This code defines a HealthDetails component that allows users to manage their health information,