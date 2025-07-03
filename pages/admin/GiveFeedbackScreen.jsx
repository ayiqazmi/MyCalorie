// pages/admin/GiveFeedbackScreen.jsx

import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator, TextInput,
  TouchableOpacity, Alert, ScrollView
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import {
  doc, getDoc, setDoc, collection,
  getDocs, query, orderBy, deleteDoc
} from 'firebase/firestore';
import { db, auth } from '../../config/firebase-config';
import { subDays, format } from 'date-fns';

export default function GiveFeedbackScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { userId } = route.params;

  const [summary, setSummary] = useState({});
  const [feedback, setFeedback] = useState('');
  const [feedbackHistory, setFeedbackHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const today = new Date();
      const tempSummary = {};

      // 🔁 Fetch 7 days of calorie intake
      for (let i = 0; i < 7; i++) {
        const date = subDays(today, i);
        const formatted = format(date, 'yyyy-MM-dd');

        try {
          const mealSnap = await getDoc(doc(db, `users/${userId}/meals/${formatted}`));
          if (mealSnap.exists()) {
            const meals = mealSnap.data().meals || [];
            const total = meals.reduce((sum, item) => sum + (item.calories || 0), 0);
            tempSummary[formatted] = total;
          } else {
            tempSummary[formatted] = 0;
          }
        } catch (error) {
          console.error(`Error fetching meal for ${formatted}:`, error);
          tempSummary[formatted] = 0;
        }
      }

      // 📄 Fetch feedbacks
      try {
        const q = query(collection(db, `users/${userId}/feedbacks`), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        const list = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setFeedbackHistory(list);
      } catch (err) {
        console.error('Error fetching feedbacks:', err);
      }

      setSummary(tempSummary);
      setLoading(false);
    };

    fetchData();
  }, [userId]);

  const handleSubmitFeedback = async () => {
    if (!feedback.trim()) {
      Alert.alert('Empty Feedback', 'Please write something before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      const feedbackRef = doc(collection(db, `users/${userId}/feedbacks`));
      await setDoc(feedbackRef, {
        createdAt: new Date(),
        caloriesSummary: summary,
        message: feedback.trim(),
        givenBy: auth.currentUser.displayName || auth.currentUser.email,
givenByUid: auth.currentUser.uid, // (optional, for traceability)
      });

      // ✅ Set notification flag
await setDoc(doc(db, `users/${userId}`), {
  hasNewFeedback: true,
}, { merge: true });

      Alert.alert('Success', 'Feedback submitted successfully.');
      setFeedback('');
      navigation.goBack(); // or remove this line to stay on screen
    } catch (error) {
      console.error('Error submitting feedback:', error);
      Alert.alert('Error', 'Failed to submit feedback.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteFeedback = (feedbackId) => {
  Alert.alert(
    'Delete Feedback',
    'Are you sure you want to delete this feedback?',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDoc(doc(db, `users/${userId}/feedbacks/${feedbackId}`));
            setFeedbackHistory(prev => prev.filter(item => item.id !== feedbackId));
            Alert.alert('Deleted', 'Feedback removed successfully.');
          } catch (err) {
            console.error('Delete error:', err);
            Alert.alert('Error', 'Failed to delete feedback.');
          }
        },
      },
    ]
  );
};

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6C63FF" />
        <Text style={styles.loadingText}>Fetching data...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>📝 Give Feedback</Text>
      <Text style={styles.subtext}>7-Day Calorie Intake Summary:</Text>

      {Object.entries(summary).map(([date, calories]) => (
        <View key={date} style={styles.summaryItem}>
          <Text style={styles.summaryDate}>{date}</Text>
          <Text style={styles.summaryValue}>{calories} kcal</Text>
        </View>
      ))}

      <Text style={styles.label}>Feedback:</Text>
      <TextInput
        style={styles.textArea}
        placeholder="Write your feedback here..."
        placeholderTextColor="#8AA2C1"
        multiline
        numberOfLines={5}
        value={feedback}
        onChangeText={setFeedback}
      />

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmitFeedback} disabled={submitting}>
        <Text style={styles.submitText}>{submitting ? 'Submitting...' : '✅ Submit Feedback'}</Text>
      </TouchableOpacity>

      {feedbackHistory.length > 0 && (
        <>
          <Text style={styles.historyHeader}>📋 Past Feedbacks</Text>
          {feedbackHistory.map((item) => (
  <View key={item.id} style={styles.historyItem}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text style={styles.historyDate}>
        🗓 {item.createdAt.toDate().toLocaleDateString()}
      </Text>
      <TouchableOpacity onPress={() => handleDeleteFeedback(item.id)}>
        <Text style={{ color: '#FF4C4C', fontSize: 12 }}>🗑 Delete</Text>
      </TouchableOpacity>
    </View>
    <Text style={styles.historyText}>{item.message}</Text>
    <Text style={styles.historyFrom}>
      👤 Given by: {item.givenBy}
    </Text>
  </View>
))}

        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1E2A38',
    padding: 24,
    flexGrow: 1,
  },
  header: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
  },
  subtext: {
    fontSize: 14,
    color: '#8AA2C1',
    marginBottom: 16,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#2E3C50',
    padding: 10,
    marginBottom: 6,
    borderRadius: 8,
  },
  summaryDate: {
    color: '#8AA2C1',
    fontSize: 14,
  },
  summaryValue: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  label: {
    color: '#8AA2C1',
    marginTop: 20,
    marginBottom: 6,
    fontSize: 14,
  },
  textArea: {
    backgroundColor: '#3B4B61',
    color: '#fff',
    borderRadius: 8,
    padding: 12,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#6C63FF',
    paddingVertical: 14,
    marginTop: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
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
  historyHeader: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 30,
    marginBottom: 12,
  },
  historyItem: {
    backgroundColor: '#2E3C50',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  historyDate: {
    color: '#8AA2C1',
    fontSize: 13,
    marginBottom: 6,
  },
  historyText: {
    color: '#ffffff',
    fontSize: 15,
    marginBottom: 4,
  },
  historyFrom: {
    color: '#cccccc',
    fontSize: 12,
    textAlign: 'right',
  },
});
