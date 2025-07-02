import React, { useEffect, useState, useLayoutEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ImageBackground
} from 'react-native';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../config/firebase-config';
import background from '../assets/background.png'; // ✅ add this import at the top

export default function CachedFoodsScreen({ navigation, route }) {
  const [foods, setFoods] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const { mealType } = route.params || {};

  useLayoutEffect(() => {
  navigation.setOptions({ title: 'Change Your Meal!' });
}, [navigation]);


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
  <ImageBackground source={background} style={{ flex: 1 }} resizeMode="cover">
    <View style={styles.overlay}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Pick a Meal</Text>

        <TextInput
          style={styles.searchInput}
          placeholder="Search food..."
          placeholderTextColor="#888"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {filteredFoods.length > 0 ? (
          filteredFoods.map((food, index) => (
            <TouchableOpacity key={index} onPress={() => handleFoodSelect(food)} style={styles.foodCard}>
              <Text style={styles.foodName}>{food.name || 'Unnamed Food'}</Text>
              <View style={styles.nutrientsRow}>
                <Text style={styles.nutrient}>Calories: {food.calories ?? 'N/A'} kcal</Text>
                <Text style={styles.nutrient}>Protein: {food.protein ?? 'N/A'}g</Text>
                <Text style={styles.nutrient}>Carbs: {food.carbs ?? 'N/A'}g</Text>
                <Text style={styles.nutrient}>Fat: {food.fat ?? 'N/A'}g</Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.noResult}>No foods match your search.</Text>
        )}
      </ScrollView>
    </View>
  </ImageBackground>
);
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 100,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#6C63FF',
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    marginBottom: 16,
    borderColor: '#ccc',
    borderWidth: 1,
  },
  foodCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  foodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  nutrientsRow: {
    flexDirection: 'column',
    gap: 2,
  },
  nutrient: {
    fontSize: 13,
    color: '#555',
  },
  noResult: {
    textAlign: 'center',
    color: '#888',
    fontSize: 14,
    marginTop: 30,
  },
});
