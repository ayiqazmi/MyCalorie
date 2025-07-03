// file: screens/admin/AdminProfileScreen.jsx

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TextInput, TouchableOpacity, Alert } from 'react-native';
import { getAuth, signOut, sendPasswordResetEmail, updateProfile } from 'firebase/auth';
import { collection, query, where, getDocs, updateDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase-config';
import { useNavigation } from '@react-navigation/native';
import { getFunctions, httpsCallable } from 'firebase/functions';

export default function AdminProfileScreen() {
  const [profile, setProfile] = useState(null);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [promoteEmail, setPromoteEmail] = useState('');
const [promoting, setPromoting] = useState(false);

  const navigation = useNavigation();
  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProfile(data);
          setUsername(data.username);
        }
      } catch (error) {
        console.error('Error fetching admin profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleSaveUsername = async () => {
    if (!username.trim()) return Alert.alert('Username cannot be empty');
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), { username });
      await updateProfile(user, { displayName: username });
      Alert.alert('Success', 'Username updated');
    } catch (error) {
      console.error('Error updating username:', error);
      Alert.alert('Error', 'Failed to update username');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    try {
      await sendPasswordResetEmail(auth, user.email);
      Alert.alert('Password Reset', 'Check your email to reset your password.');
    } catch (error) {
      console.error('Password reset error:', error);
      Alert.alert('Error', 'Could not send password reset email');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigation.replace('Login'); // or your login screen name
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handlePromoteUser = async () => {
  if (!promoteEmail.trim()) {
    Alert.alert('Error', 'Email cannot be empty');
    return;
  }

  setPromoting(true);
  try {
    // 🔍 1. Lookup user by email
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', promoteEmail.trim()));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      Alert.alert('Not Found', 'No user found with this email.');
      setPromoting(false);
      return;
    }

    const userDoc = snapshot.docs[0];
    const targetUid = userDoc.id;

    // ✅ 2. Call Cloud Function to set custom claim
    const functions = getFunctions();
    const promoteToAdmin = httpsCallable(functions, 'promoteToAdmin');
    const result = await promoteToAdmin({ uid: targetUid });

    // ✅ 3. Optionally update Firestore `role` too
    await updateDoc(userDoc.ref, { role: 'admin', isAdmin: true });

    Alert.alert('Success', result.data.message || 'User promoted to admin.');
    setPromoteEmail('');
  } catch (error) {
    console.error('Promotion error:', error);
    Alert.alert('Error', error.message || 'Failed to promote user.');
  } finally {
    setPromoting(false);
  }
};


  if (loading) return <ActivityIndicator size="large" style={{ marginTop: 30 }} color="#6C63FF" />;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>👤 Admin Profile</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Username</Text>
        <TextInput
          style={styles.input}
          value={username}
          onChangeText={setUsername}
          placeholder="Enter new username"
          placeholderTextColor="#8AA2C1"
        />
        <TouchableOpacity style={styles.saveButton} onPress={handleSaveUsername} disabled={saving}>
          <Text style={styles.saveText}>{saving ? 'Saving...' : '💾 Save Username'}</Text>
        </TouchableOpacity>

        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{profile?.email}</Text>

        <Text style={styles.label}>Role</Text>
        <Text style={styles.value}>{profile?.role ?? 'admin'}</Text>

        <Text style={styles.label}>Joined</Text>
        <Text style={styles.value}>
          {profile?.createdAt?.toDate().toLocaleDateString() ?? 'N/A'}
        </Text>

        <TouchableOpacity style={styles.passwordButton} onPress={handleChangePassword}>
          <Text style={styles.saveText}>🔒 Change Password</Text>
        </TouchableOpacity>

        <Text style={styles.label}>Promote User to Admin</Text>
<TextInput
  style={styles.input}
  placeholder="Enter user email"
  placeholderTextColor="#8AA2C1"
  value={promoteEmail}
  onChangeText={setPromoteEmail}
/>
<TouchableOpacity
  style={styles.saveButton}
  onPress={handlePromoteUser}
  disabled={promoting}
>
  <Text style={styles.saveText}>
    {promoting ? 'Promoting...' : 'Promote to Admin'}
  </Text>
</TouchableOpacity>

      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>🚪 Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E2A38',
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#2E3C50',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#6C63FF',
  },
  label: {
    color: '#8AA2C1',
    fontSize: 14,
    marginTop: 16,
    marginBottom: 4,
  },
  value: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#3B4B61',
    color: '#fff',
    padding: 10,
    borderRadius: 8,
  },
  saveButton: {
    backgroundColor: '#6C63FF',
    marginTop: 10,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  passwordButton: {
    backgroundColor: '#4F80FF',
    marginTop: 20,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  logoutButton: {
    marginTop: 30,
    backgroundColor: '#FF5C5C',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
