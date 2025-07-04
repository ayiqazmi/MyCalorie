import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase-config';

export async function saveMealPlan(userId, date, plan) {
  const ref = doc(db, 'users', userId, 'mealPlans', date);
  await setDoc(ref, plan);
}

export async function getMealPlan(userId, date) {
  const ref = doc(db, 'users', userId, 'mealPlans', date);
  const snapshot = await getDoc(ref);
  return snapshot.exists() ? snapshot.data() : null;
}
