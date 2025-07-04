import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, StyleSheet, Modal, ScrollView, TextInput } from 'react-native';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../config/firebase-config';

export default function RejectedMealsScreen() {
  const [rejectedMeals, setRejectedMeals] = useState([]);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editableMeal, setEditableMeal] = useState(null);


  useEffect(() => {
    fetchRejectedMeals();
  }, []);

  const fetchRejectedMeals = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'rejectedFoodsLog'));
      const meals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRejectedMeals(meals);
    } catch (error) {
      console.error('Error fetching rejected meals:', error);
      Alert.alert('Error', 'Failed to load rejected meals.');
    }
  };

const handleReapprove = async () => {
  const mealData = { ...editableMeal };
  delete mealData.id;
  delete mealData.rejectedAt;
  delete mealData.rejectedBy;
  delete mealData.reason;

  try {
    await setDoc(doc(db, 'malaysianFoods', selectedMeal.id), mealData);
    await deleteDoc(doc(db, 'rejectedFoodsLog', selectedMeal.id));
    Alert.alert('✅ Re-approved', 'Meal moved to malaysianFoods.');
    setShowModal(false);
    fetchRejectedMeals();
  } catch (error) {
    console.error('Reapprove error:', error);
    Alert.alert('Error', 'Failed to reapprove meal.');
  }
};


  const renderMeal = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => {
  setSelectedMeal(item);
  setEditableMeal({ ...item });
  setShowModal(true);
}}
>
      <Text style={styles.mealName}>{item.name}</Text>
      <Text style={styles.subText}>Rejected by: {item.rejectedBy || 'N/A'}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Rejected Meals Log</Text>
      <FlatList
        data={rejectedMeals}
        keyExtractor={(item) => item.id}
        renderItem={renderMeal}
        ListEmptyComponent={<Text style={styles.emptyText}>No rejected meals found.</Text>}
      />

      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
              <Text style={styles.modalTitle}>{selectedMeal?.name}</Text>

              {selectedMeal && (
                <>
                  <Text style={styles.meta}>Rejected By: {selectedMeal.rejectedBy}</Text>
                  <Text style={styles.meta}>Reason: {selectedMeal.reason || 'None provided'}</Text>
                  <Text style={styles.meta}>Rejected At: {new Date(selectedMeal.rejectedAt).toLocaleString()}</Text>

                  <View style={styles.divider} />

                    {editableMeal &&
  Object.entries(editableMeal).map(([key, value]) => {
    if (['id', 'rejectedAt', 'rejectedBy', 'reason', 'submittedAt', 'userId'].includes(key)) return null;
    return (
      <TextInput
        key={key}
        value={editableMeal[key]?.toString()}
        onChangeText={(text) =>
          setEditableMeal({ ...editableMeal, [key]: key === 'name' ? text : parseFloat(text) || 0 })
        }
        placeholder={key}
        style={styles.input}
        keyboardType={key === 'name' ? 'default' : 'numeric'}
      />
    );
  })}

                </>
              )}

              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#4CAF50', marginTop: 20 }]}
                onPress={handleReapprove}
              >
                <Text style={styles.buttonText}>🔁 Re-Approve</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#888', marginTop: 10 }]}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.buttonText}>Close</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1E2A38', padding: 20 },
  header: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 20, textAlign: 'center' },
  card: { backgroundColor: '#2E3C50', padding: 16, borderRadius: 12, marginBottom: 16 },
  mealName: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  subText: { color: '#ccc', marginTop: 5 },
  emptyText: { color: '#ccc', textAlign: 'center', marginTop: 40 },

  modalBackground: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContainer: { backgroundColor: 'white', padding: 20, borderRadius: 10, maxHeight: '85%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  meta: { fontSize: 14, marginBottom: 4, color: '#333' },
  divider: { height: 1, backgroundColor: '#ccc', marginVertical: 10 },
  nutrient: { fontSize: 14, marginBottom: 6 },
  modalButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: { color: 'white', fontWeight: 'bold' },
  input: {
  borderWidth: 1,
  borderColor: '#ccc',
  borderRadius: 6,
  padding: 10,
  marginBottom: 10,
  fontSize: 14,
},

});
