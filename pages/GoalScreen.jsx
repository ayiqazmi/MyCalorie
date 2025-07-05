import React, { useState, useEffect, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase-config.js';

export default function GoalScreen({ navigation }) {
  const [goalData, setGoalData] = useState(null);
  const [loading, setLoading] = useState(true);

  useLayoutEffect(() => {
    navigation.setOptions({ title: 'Your Goal' });
  }, [navigation]);

  useEffect(() => {
    const fetchGoal = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const goalRef = doc(db, `users/${user.uid}/goal/target`);
        const goalSnap = await getDoc(goalRef);

        if (goalSnap.exists()) {
          setGoalData(goalSnap.data());
        }
      } catch (error) {
        console.error("Error fetching goal data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGoal();
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  if (!goalData) {
    return (
      <View style={styles.centered}>
        <Text style={styles.message}>No goal data found.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>🎯 Your Health Goal</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Current Weight</Text>
        <Text style={styles.value}>{goalData.currentWeight} kg</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Target Weight</Text>
        <Text style={styles.value}>{goalData.targetWeight} kg</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Weight to Lose</Text>
        <Text style={styles.value}>{goalData.weightToLose} kg</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Estimated Duration</Text>
        <Text style={styles.value}>{goalData.estimatedMonths} months</Text>
      </View>

      <Text style={styles.footerNote}>🏁 Keep pushing! You're on the right track.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
    backgroundColor: '#F9F9F9',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    fontSize: 26,
    fontWeight: '700',
    color: '#6C63FF',
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  label: {
    fontSize: 16,
    color: '#888',
    marginBottom: 4,
  },
  value: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  message: {
    fontSize: 16,
    color: '#555',
  },
  footerNote: {
    marginTop: 20,
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});
