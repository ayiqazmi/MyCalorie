import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal } from 'react-native';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../config/firebase-config';
import { format } from 'date-fns';
import SearchMealModal from './SearchMealModal'; // We’ll create this next
import { useNavigation } from '@react-navigation/native';

export default function AdjustMealPlanScreen({ route, navigation }) {
  const { userId, selectedDate } = route.params;
  const [mealPlan, setMealPlan] = useState({});
  const [selectedMealType, setSelectedMealType] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const formattedDate = format(new Date(selectedDate), 'yyyy-MM-dd');
  //const navigation = useNavigation();

  useEffect(() => {
    const fetchMealPlan = async () => {
      const mealDocRef = doc(db, 'users', userId, 'mealPlans', formattedDate);
      const snap = await getDoc(mealDocRef);
      if (snap.exists()) {
        setMealPlan(snap.data().plan || {});
      }
    };
    fetchMealPlan();
  }, [userId, selectedDate]);

  const handleSelectMeal = (mealType) => {
    setSelectedMealType(mealType);
    setShowModal(true);
  };

  const handleMealReplace = (mealType, newMeal) => {
    setMealPlan(prev => ({
      ...prev,
      [mealType]: [newMeal],
    }));
    setShowModal(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Adjust Meal Plan for {formattedDate}</Text>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {['breakfast', 'lunch', 'dinner', 'snacks'].map(type => (
          <TouchableOpacity
            key={type}
            style={styles.card}
            onPress={() => handleSelectMeal(type)}
          >
            <Text style={styles.cardTitle}>{type.toUpperCase()}</Text>
            <Text style={styles.cardText}>
              {mealPlan[type]?.[0]?.name || 'No meal selected'}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>


      <TouchableOpacity
  style={styles.saveBtn}
onPress={async () => {
  try {
    const mealDocRef = doc(db, 'users', userId, 'mealPlans', formattedDate);

    await setDoc(mealDocRef, {
      plan: mealPlan, // write full plan (not just one meal)
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    navigation.goBack(); // ✅ just go back
  } catch (err) {
    console.error('❌ Failed to save meal plan:', err);
  }
}}


>
  <Text style={styles.saveBtnText}>💾 Save & Return</Text>
</TouchableOpacity>


      {/* Search Modal */}
      <Modal visible={showModal} animationType="slide">
        <SearchMealModal
          mealType={selectedMealType}
          onSelectMeal={handleMealReplace}
          onClose={() => setShowModal(false)}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#1E2A38' },
  heading: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 12 },
  card: {
    backgroundColor: '#2E3C50',
    padding: 16,
    marginBottom: 12,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderColor: '#6C63FF',
  },
  cardTitle: { color: '#A8C1FF', fontSize: 16, fontWeight: 'bold' },
  cardText: { color: '#ccc', fontSize: 14, marginTop: 6 },
  saveBtn: {
  backgroundColor: '#6C63FF',
  paddingVertical: 14,
  borderRadius: 12,
  marginTop: 20,
  marginHorizontal: 16,
  alignItems: 'center',
},
saveBtnText: {
  color: 'white',
  fontWeight: 'bold',
  fontSize: 16,
},

});
