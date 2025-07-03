import React, { useState, useLayoutEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ImageBackground,
  Alert,
} from 'react-native';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase-config';
import background from '../assets/background.png';
import { Ionicons } from '@expo/vector-icons';
import { getAuth } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { format } from 'date-fns';


const API_KEY = "wDuhwYZWD0jLgS1YfSEBPrEgjonLtLYMHDcT0Dk1";

export default function CachedFoodsScreen({ navigation, route }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const { mealType } = route.params || {};

  useLayoutEffect(() => {
    navigation.setOptions({ title: 'Search New Meal' });
  }, [navigation]);

  const searchFood = async () => {
    try {
      console.log("🔍 Searching:", searchTerm);

      // USDA fetch
      const usdaResponse = await fetch(`https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${API_KEY}&query=${searchTerm}`);
      const usdaData = await usdaResponse.json();

      const usdaResults = (usdaData.foods || []).map(food => ({
        id: `usda-${food.fdcId}`,
        name: food.description,
        source: "USDA",
        calories: food.foodNutrients?.find(n => n.nutrientName === "Energy")?.value || 0,
        protein: food.foodNutrients?.find(n => n.nutrientName === "Protein")?.value || 0,
        carbs: food.foodNutrients?.find(n => n.nutrientName === "Carbohydrate, by difference")?.value || 0,
        fat: food.foodNutrients?.find(n => n.nutrientName === "Total lipid (fat)")?.value || 0,
      }));

      // Malaysian foods fetch
      const snapshot = await getDocs(collection(db, "malaysianFoods"));
      const malaysianResults = snapshot.docs
        .map(doc => ({ id: `mal-${doc.id}`, ...doc.data(), source: "Malaysia" }))
        .filter(food => food.name.toLowerCase().includes(searchTerm.toLowerCase()));

      // Combine
      const mergedResults = [...usdaResults, ...malaysianResults];
      setSearchResults(mergedResults);
    } catch (error) {
      console.error("Search error:", error);
      Alert.alert("Error", "Failed to fetch food data.");
    }
  };

const handleFoodSelect = async (food) => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    const today = new Date();
    const formattedDate = format(today, 'yyyy-MM-dd');

    const mealPlanRef = doc(db, "users", user.uid, "mealPlans", formattedDate);
    const mealPlanSnap = await getDoc(mealPlanRef);

    let currentPlan = {};
    if (mealPlanSnap.exists()) {
      currentPlan = mealPlanSnap.data().plan || {};
    }

    const existingMeals = currentPlan[mealType] || [];

    const updatedPlan = {
      ...currentPlan,
      [mealType]: [food], // ✅ overwrite the mealType with just this one food
 // ✅ append to mealType
    };

    await setDoc(mealPlanRef, {
      plan: updatedPlan,
      createdAt: Date.now(),
    });

    navigation.navigate("MealPlan", { refresh: true });

  } catch (err) {
    console.error("Error updating meal plan:", err);
  }
};

  return (
    <ImageBackground source={background} style={{ flex: 1 }} resizeMode="cover">
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Search for a Food</Text>

        <TextInput
          style={styles.searchInput}
          placeholder="Search food..."
          placeholderTextColor="#888"
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
        <TouchableOpacity onPress={searchFood} style={styles.searchButton}>
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>

        {searchResults.length > 0 ? (
          searchResults.map((food, index) => (
            <TouchableOpacity key={index} onPress={() => handleFoodSelect(food)} style={styles.foodCard}>
              <Text style={styles.foodName}>{food.name || 'Unnamed Food'} ({food.source})</Text>
              <View style={styles.nutrientsRow}>
                <Text style={styles.nutrient}>Calories: {food.calories ?? 'N/A'} kcal</Text>
                <Text style={styles.nutrient}>Protein: {food.protein ?? 'N/A'}g</Text>
                <Text style={styles.nutrient}>Carbs: {food.carbs ?? 'N/A'}g</Text>
                <Text style={styles.nutrient}>Fat: {food.fat ?? 'N/A'}g</Text>
              </View>
              <Ionicons name="add-circle-outline" size={20} color="green" />
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.noResult}>No foods match your search.</Text>
        )}
      </ScrollView>
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
    marginBottom: 10,
    borderColor: '#ccc',
    borderWidth: 1,
  },
  searchButton: {
    backgroundColor: '#6C63FF',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: '600',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  foodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
    flex: 1,
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
