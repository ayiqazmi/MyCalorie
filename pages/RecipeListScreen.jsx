import React from 'react';
import { View, Text, ScrollView, Image, StyleSheet } from 'react-native';

export default function RecipeListScreen({ route }) {
  const { mealType, items } = route.params;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{mealType} Recipes</Text>
      {items.map((item, index) => (
        <View key={index} style={styles.card}>
          <Image source={{ uri: item.image }} style={styles.image} />
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.info}>Calories: {item.calories} kcal</Text>
          <Text style={styles.info}>Protein: {item.protein} g</Text>
          <Text style={styles.info}>Carbs: {item.carbs} g</Text>
          <Text style={styles.info}>Fats: {item.fat || item.fats || 0} g</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#f0efff' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 12, color: '#6C63FF' },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
    elevation: 3,
  },
  image: { width: '100%', height: 160, borderRadius: 8 },
  name: { fontSize: 16, fontWeight: '600', marginTop: 8 },
  info: { fontSize: 12, color: '#555' },
});
