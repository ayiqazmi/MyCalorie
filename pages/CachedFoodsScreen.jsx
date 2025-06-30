import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput
} from 'react-native';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../config/firebase-config';

export default function CachedFoodsScreen({ navigation, route }) {
  const [foods, setFoods] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const { mealType } = route.params || {};

useEffect(() => {
  const fetchFoods = async () => {
    try {
      // Fetch USDA foods
      const usdaSnapshot = await getDocs(collection(db, 'usdaCache'));
      const usdaFoods = [];
      usdaSnapshot.forEach(doc => {
        const termFoods = doc.data().results || [];
        usdaFoods.push(...termFoods);
      });
      const validUSDAs = usdaFoods.filter(food => food && food.name);

      // Fetch Malaysian foods by category
      const malaysianQuery = query(
        collection(db, 'malaysianFoods'),
        where('category', '==', mealType?.toLowerCase() || 'breakfast')
      );
      const malaysianSnapshot = await getDocs(malaysianQuery);
      const malaysianFoods = malaysianSnapshot.docs.map(doc => doc.data());

      // Combine both
      const allFoods = [...validUSDAs, ...malaysianFoods];
      setFoods(allFoods);
    } catch (error) {
      console.error('Error fetching foods:', error);
    }
  };

  fetchFoods();
}, [mealType]);


  const handleFoodSelect = (food) => {
    navigation.navigate({
      name: 'MealPlan',
      params: {
        selectedFood: food,
        mealType: route.params?.mealType || 'custom',
      },
      merge: true,
    });
  };

  const filteredFoods = foods.filter(food =>
    food.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#f2f2f2' }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Pick a Meal</Text>

        <TextInput
          style={styles.searchInput}
          placeholder="Search food..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {filteredFoods.length > 0 ? (
          filteredFoods.map((food, index) => (
            <TouchableOpacity key={index} onPress={() => handleFoodSelect(food)} style={styles.foodCard}>
              <Text style={styles.foodName}>{food.name || 'Unnamed Food'}</Text>
              <Text style={styles.nutrient}>Calories: {food.calories ?? 'N/A'}</Text>
              <Text style={styles.nutrient}>Protein: {food.protein ?? 'N/A'}g</Text>
              <Text style={styles.nutrient}>Carbs: {food.carbs ?? 'N/A'}g</Text>
              <Text style={styles.nutrient}>Fat: {food.fat ?? 'N/A'}g</Text>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={{ color: '#555' }}>No foods match your search.</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
    fontSize: 14,
  },
  foodCard: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    elevation: 2,
  },
  foodName: { fontSize: 16, fontWeight: '600' },
  nutrient: { fontSize: 12, color: '#333' },
});
