import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function AdminDashboardScreen() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Admin Dashboard</Text>
      <Text style={styles.subtext}>🔐 Admin Access Mode</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('UserList')}
      >
        <Text style={styles.buttonText}>👤 View Users</Text>
      </TouchableOpacity>

      <TouchableOpacity
  style={styles.button}
  onPress={() => navigation.navigate('AdminProfile')}
>
  <Text style={styles.buttonText}>📄 View Admin Profile</Text>
</TouchableOpacity>

<TouchableOpacity
  style={styles.button}
  onPress={() => navigation.navigate('PendingMeals')}
>
  <Text style={styles.buttonText}>🍽️ Review Custom Meals</Text>
</TouchableOpacity>

<TouchableOpacity
  style={styles.button}
  onPress={() => navigation.navigate('RejectedMeals')}
>
  <Text style={styles.buttonText}>❌ View Rejected Meals</Text>
</TouchableOpacity>


    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E2A38', // dark navy/blue background
    padding: 24,
    gap: 16,
    justifyContent: 'center',
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtext: {
    fontSize: 14,
    color: '#8AA2C1',
    marginBottom: 30,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#2E3C50',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#6C63FF',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
