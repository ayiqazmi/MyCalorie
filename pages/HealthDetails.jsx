import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity, Alert, ImageBackground, Dimensions
} from 'react-native';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase-config.js';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

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

const getBmiCategory = (value) => {
  const bmiVal = parseFloat(value);
  if (bmiVal < 18.5) return 'Underweight';
  if (bmiVal < 25) return 'Healthy';
  if (bmiVal < 30) return 'Overweight';
  return 'Obese';
};

const getBmiBoxStyle = () => {
  const category = getBmiCategory(bmi);
  if (category === 'Underweight') return { backgroundColor: '#FFD54F' };
  if (category === 'Healthy') return { backgroundColor: '#A5D6A7' };
  if (category === 'Overweight') return { backgroundColor: '#FF8A65' };
  if (category === 'Obese') return { backgroundColor: '#EF5350' };
  return {};
};

const getBmiTextStyle = () => ({
  color: '#fff',
  fontWeight: 'bold',
});




return (
    <ImageBackground
      source={require('../assets/background.png')}
      style={{ flex: 1 }}
      resizeMode="cover"
    >

      

      <ScrollView contentContainerStyle={styles.container}>

        <View style={styles.tabContainer}>
  <TouchableOpacity
    style={[styles.tab, styles.leftTab]}
    onPress={() => navigation.goBack()} // assumes "About You" is previous screen
  >
    <Text style={styles.tabText}>About You</Text>
  </TouchableOpacity>
  <View style={[styles.tab, styles.activeTab]}>
    <Text style={[styles.tabText, styles.activeTabText]}>Health Details</Text>
  </View>
</View>
        <Text style={styles.header}>Health Details</Text>

        <Text style={styles.label}>Gender</Text>
        <View style={styles.inputBox}>
          <Picker
            selectedValue={gender}
            onValueChange={setGender}
            style={styles.picker}
          >
            <Picker.Item label="Select gender" value="" />
            <Picker.Item label="Male" value="Male" />
            <Picker.Item label="Female" value="Female" />
          </Picker>
        </View>

        <Text style={styles.label}>Birthday</Text>
        <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.inputBox}>
          <Text style={styles.textInput}>
            {birthday ? `🎂 ${birthday}` : 'Select Birthday'}
          </Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={birthday ? new Date(birthday) : new Date()}
            mode="date"
            display="default"
            onChange={handleDateChange}
          />
        )}

        <Text style={styles.label}>Age</Text>
        <View style={styles.readOnlyBox}>
          <Text style={styles.textInput}>{age !== null ? `${age} years` : '--'}</Text>
        </View>

        <Text style={styles.label}>Height (cm)</Text>
        <TextInput
          style={styles.inputBox}
          placeholder="Enter height"
          placeholderTextColor="#888"
          value={height}
          onChangeText={handleHeightChange}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Weight (kg)</Text>
        <TextInput
          style={styles.inputBox}
          placeholder="Enter weight"
          placeholderTextColor="#888"
          value={weight}
          onChangeText={handleWeightChange}
          keyboardType="numeric"
        />

        <Text style={styles.label}>BMI</Text>
<View style={[styles.readOnlyBox, getBmiBoxStyle()]}>
  <Text style={[styles.textInput, getBmiTextStyle()]}>
    {bmi !== null ? `${bmi} (${getBmiCategory(bmi)})` : '--'}
  </Text>
</View>

        <Text style={styles.label}>Health Complications</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={[styles.inputBox, { flex: 1 }]}
            placeholder="Add health complication"
            value={currentHealthComp}
            onChangeText={setCurrentHealthComp}
            placeholderTextColor="#888"
          />
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
          <TextInput
            style={[styles.inputBox, { flex: 1 }]}
            placeholder="Add allergy"
            value={currentAllergy}
            onChangeText={setCurrentAllergy}
            placeholderTextColor="#888"
          />
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
        <View style={styles.inputBox}>
          <Picker selectedValue={goal} onValueChange={setGoal} style={styles.picker}>
            <Picker.Item label="Select Goal" value="" />
            <Picker.Item label="Lose Weight" value="lose" />
            <Picker.Item label="Maintain Weight" value="maintain" />
            <Picker.Item label="Gain Weight" value="gain" />
          </Picker>
        </View>

        <Text style={styles.label}>Activity Level</Text>
        <View style={styles.inputBox}>
          <Picker selectedValue={activityLevel} onValueChange={setActivityLevel} style={styles.picker}>
            <Picker.Item label="Sedentary (little/no exercise)" value="sedentary" />
            <Picker.Item label="Lightly Active (1–3x/week)" value="light" />
            <Picker.Item label="Moderately Active (3–4x/week)" value="moderate" />
            <Picker.Item label="Very Active (4–5x/week)" value="active" />
            <Picker.Item label="Extra Active (daily intense/physical job)" value="very_active" />
          </Picker>
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'stretch',
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#7C3AED',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    color: '#333',
    marginBottom: 6,
    marginTop: 12,
  },
  inputBox: {
    backgroundColor: '#fff',
    borderRadius: 30,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 10,
  },
  readOnlyBox: {
    backgroundColor: '#eee',
    borderRadius: 30,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 10,
  },
  textInput: {
    fontSize: 16,
    color: '#333',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  addButton: {
    backgroundColor: '#8E24AA',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 30,
    marginLeft: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6A1B9A',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    margin: 4,
  },
  chipText: {
    color: '#fff',
    marginRight: 6,
  },
  picker: {
    width: '100%',
    height: 44,
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#8E24AA',
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  tabContainer: {
  flexDirection: 'row',
  backgroundColor: 'white',
  borderRadius: 30,
  overflow: 'hidden',
  marginBottom: 20,
},
tab: {
  flex: 1,
  paddingVertical: 12,
  alignItems: 'center',
  backgroundColor: '#E0BBFF',
},
leftTab: {
  borderTopLeftRadius: 30,
  borderBottomLeftRadius: 30,
},
activeTab: {
  backgroundColor: '#8E24AA',
  borderTopRightRadius: 30,
  borderBottomRightRadius: 30,
},
tabText: {
  color: '#6A1B9A',
  fontWeight: 'bold',
},
activeTabText: {
  color: 'white',
},

});
// This code defines a HealthDetails component that allows users to manage their health information,