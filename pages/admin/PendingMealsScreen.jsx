import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, StyleSheet, Modal, ScrollView, TextInput } from 'react-native';
import { collection, query, where, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../config/firebase-config';
import { getAuth } from 'firebase/auth'; // for admin email

export default function PendingMealsScreen() {
  const [pendingMeals, setPendingMeals] = useState([]);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [editableMeal, setEditableMeal] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');


  useEffect(() => {
    fetchPendingMeals();
  }, []);

  const fetchPendingMeals = async () => {
    try {
      const q = query(collection(db, 'customFoodsPending'), where('status', '==', 'pending'));
      const querySnapshot = await getDocs(q);
      const results = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPendingMeals(results);
    } catch (error) {
      console.error('Error fetching pending meals:', error);
      Alert.alert('Error', 'Failed to load pending meals.');
    }
  };

  const handleVerify = async () => {
    const newMeal = { ...editableMeal };
    delete newMeal.id; // remove ID before inserting

    try {
      await setDoc(doc(db, 'malaysianFoods', selectedMeal.id), newMeal);
      await deleteDoc(doc(db, 'customFoodsPending', selectedMeal.id));
      Alert.alert('✅ Meal Verified', 'Meal has been added to malaysianFoods.');
      setShowModal(false);
      fetchPendingMeals();
    } catch (error) {
      console.error('Verification error:', error);
      Alert.alert('Error', 'Could not verify meal.');
    }
  };

const handleReject = async () => {
  try {
    const adminEmail = getAuth().currentUser?.email || 'unknown';

    const logRef = doc(db, 'rejectedFoodsLog', selectedMeal.id);
    await setDoc(logRef, {
      ...selectedMeal,
      rejectedAt: new Date().toISOString(),
      rejectedBy: adminEmail,
      reason: rejectionReason || '',
    });

    await deleteDoc(doc(db, 'customFoodsPending', selectedMeal.id));
    Alert.alert('❌ Rejected', 'Meal logged and removed.');
    setShowModal(false);
    setRejectionReason('');
    fetchPendingMeals();
  } catch (error) {
    console.error('Rejection error:', error);
    Alert.alert('Error', 'Could not reject meal.');
  }
};


  const openMealModal = (meal) => {
    setSelectedMeal(meal);
    setEditableMeal({ ...meal });
    setShowModal(true);
  };

  const renderMeal = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => openMealModal(item)}>
      <Text style={styles.mealName}>{item.name}</Text>
      <Text style={styles.subText}>Tap to review & edit</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Pending Meals for Review</Text>
      <FlatList
        data={pendingMeals}
        keyExtractor={(item) => item.id}
        renderItem={renderMeal}
        ListEmptyComponent={<Text style={styles.emptyText}>No meals awaiting approval.</Text>}
      />

      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
              <Text style={styles.modalTitle}>Edit & Verify: {editableMeal?.name}</Text>

              {editableMeal &&
                Object.entries(editableMeal).map(([key, value]) => {
                  if (['id', 'userId', 'status', 'submittedAt'].includes(key)) return null;
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
<TextInput
  placeholder="Reason for rejection (optional)"
  value={rejectionReason}
  onChangeText={setRejectionReason}
  style={[styles.input, { backgroundColor: '#f9f9f9' }]}
/>

              <View style={styles.modalButtons}>
                
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: '#4CAF50' }]}
                  onPress={handleVerify}
                >
                  <Text style={styles.buttonText}>✅ Verify</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: '#F44336' }]}
                  onPress={handleReject}
                >
                  <Text style={styles.buttonText}>❌ Reject</Text>
                </TouchableOpacity>
              </View>

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
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
    fontSize: 14,
  },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  modalButton: { flex: 1, padding: 10, borderRadius: 8, alignItems: 'center', marginHorizontal: 5 },
  buttonText: { color: 'white', fontWeight: 'bold' },
});
