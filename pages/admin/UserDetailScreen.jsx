// pages/admin/UserDetailScreen.jsx

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Button, ActivityIndicator, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase-config';
import { format } from 'date-fns';
import { getFunctions, httpsCallable } from 'firebase/functions';
const getMealData = async (uid, date) => {
  try {
    const docRef = doc(db, `users/${uid}/meals/${date}`);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const mealData = docSnap.data();
      const meals = {};

      for (const mealType in mealData) {
        meals[mealType] = mealData[mealType]?.items || [];
      }

      return meals;
    } else {
      return {};
    }
  } catch (error) {
    console.error('Error fetching meal data:', error);
    return {};
  }
};

export default function UserDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { userId } = route.params;

  const [userData, setUserData] = useState(null);
  const [totalCalories, setTotalCalories] = useState(0);
  const [loading, setLoading] = useState(true);

  const today = format(new Date(), 'yyyy-MM-dd');

  const functions = getFunctions();

  const handleDeleteUser = async () => {
  try {
    const deleteUserFn = httpsCallable(functions, 'adminDeleteUser');
    const res = await deleteUserFn({ uid: userId });

    if (res.data.success) {
      Alert.alert("User deleted", "The user has been successfully removed.");
      navigation.goBack();
    } else {
      Alert.alert("Failed", res.data.error || "An error occurred.");
    }
  } catch (err) {
    console.error("Deletion error:", err);
    Alert.alert("Error", "Failed to delete user.");
  }
};

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userSnap = await getDoc(doc(db, 'users', userId));
        if (userSnap.exists()) setUserData(userSnap.data());

        const meals = await getMealData(userId, today);

      let total = 0;
      for (const mealType in meals) {
        meals[mealType].forEach((item) => {
          total += item.calories || 0;
        });
      }

      setTotalCalories(total);
      } catch (error) {
        console.error("Error fetching user detail:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6C63FF" />
        <Text style={styles.loadingText}>Loading user data...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container} style={{ backgroundColor: '#1E2A38' }}>
      <Text style={styles.header}>👤 User Detail</Text>
      <Text style={styles.subtext}>🔐 Admin Access Mode</Text>

      <Text style={styles.label}>Username:</Text>
      <Text style={styles.value}>{userData?.username || 'N/A'}</Text>

      <Text style={styles.label}>Email:</Text>
      <Text style={styles.value}>{userData?.email}</Text>

      <Text style={styles.label}>🔥 Today's Calorie Intake:</Text>
      <Text style={styles.value}>{totalCalories} kcal</Text>

      <View style={styles.buttonGroup}>
        <Button
          title="View Full Meal Plan"
          color="#6C63FF"
          onPress={() => navigation.navigate('AdminMealPlan', { targetUserId: userId })}

        />
        <Button
          title="Give Feedback"
          color="#6C63FF"
          onPress={() => navigation.navigate('GiveFeedback', { userId })}
        />
        
          <Button
    title="Delete User Account"
    color="#FF3B30"
    onPress={() => {
      Alert.alert(
        "Confirm Deletion",
        "Are you sure you want to permanently delete this user account?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: handleDeleteUser,
          },
        ]
      );
    }}
  />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#1E2A38',
    flexGrow: 1,
  },
  header: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtext: {
    fontSize: 14,
    color: '#8AA2C1',
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#cccccc',
    marginTop: 10,
  },
  value: {
    fontSize: 16,
    color: '#ffffff',
  },
  buttonGroup: {
    marginTop: 30,
    gap: 16,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#1E2A38',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#cccccc',
    marginTop: 10,
  },
  adminActions: {
  marginTop: 40,
  borderTopWidth: 1,
  borderTopColor: '#34495E',
  paddingTop: 20,
  gap: 10,
},
adminHeader: {
  fontSize: 16,
  fontWeight: 'bold',
  color: '#FF3B30',
  marginBottom: 10,
},

});
