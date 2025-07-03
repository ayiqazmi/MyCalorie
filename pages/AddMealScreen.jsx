import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  ScrollView,
  ImageBackground,
} from "react-native";
import {
  getDocs,
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  increment,
  deleteField,
  onSnapshot,
} from "firebase/firestore";
import { auth, db } from "../config/firebase-config";
import { Ionicons } from "@expo/vector-icons";
import background from "../assets/background.png";

const API_KEY = "wDuhwYZWD0jLgS1YfSEBPrEgjonLtLYMHDcT0Dk1";

// ---------- Calculate total nutrients for the day ----------
const calculateTotals = (mealsToday) => {
  const totals = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0,
    vitaminC: 0,
    calcium: 0,
    iron: 0,
    potassium: 0,
    fiber: 0,
    sugar: 0,
  };

  Object.values(mealsToday).forEach((mealTypeData) => {
    mealTypeData.items?.forEach((item) => {
      totals.calories += item.calories || 0;
      totals.protein += item.protein || 0;
      totals.carbs += item.carbs || 0;
      totals.fats += item.fats || 0;
      totals.vitaminC += item.vitaminC || 0;
      totals.calcium += item.calcium || 0;
      totals.iron += item.iron || 0;
      totals.potassium += item.potassium || 0;
      totals.fiber += item.fiber || 0;
      totals.sugar += item.sugar || 0;
    });
  });

  return totals;
};

// ---------- Prepare food for DB or display ----------
const prepareFoodData = (food = {}) => {
  const base = {
    name: food.name || food.description || "Unnamed food",
    calories: Number(food.calories) || 0,
    protein: Number(food.protein) || 0,
    carbs: Number(food.carbs) || 0,
    fats: Number(food.fats) || 0,
    vitaminC: Number(food.vitaminC) || 0,
    calcium: Number(food.calcium) || 0,
    iron: Number(food.iron) || 0,
    potassium: Number(food.potassium) || 0,
    fiber: Number(food.fiber) || 0,
    sugar: Number(food.sugar) || 0,
  };

  if (food.source === "USDA") {
    const find = (name) =>
      Number(food.foodNutrients?.find((n) => n.nutrientName === name)?.value) || 0;

    return {
      ...base,
      vitaminC: find("Vitamin C, total ascorbic acid"),
      calcium: find("Calcium, Ca"),
      iron: find("Iron, Fe"),
      potassium: find("Potassium, K"),
      fiber: find("Fiber, total dietary"),
      sugar: find("Sugars, total including NLEA"),
    };
  }

  return base;
};

export default function AddMealScreen() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [mealType, setMealType] = useState("breakfast");
  const [mealsToday, setMealsToday] = useState({});
  const [selectedFood, setSelectedFood] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customFood, setCustomFood] = useState({
    name: "",
    calories: "",
    protein: "",
    carbs: "",
    fats: "",
    vitaminC: "",
    calcium: "",
    iron: "",
    potassium: "",
    fiber: "",
    sugar: "",
  });

  const user = auth.currentUser;
  const totals = calculateTotals(mealsToday);

  useEffect(() => {
    if (!user) return;
    const date = new Date().toISOString().split("T")[0];
    const mealRef = doc(db, "users", user.uid, "meals", date);

    const unsubscribe = onSnapshot(mealRef, (docSnap) => {
      setMealsToday(docSnap.exists() ? docSnap.data() : {});
    });

    return unsubscribe;
  }, []);

  const submitCustomFood = async () => {
    try {
      const docRef = doc(db, "customFoodsPending", `${user.uid}_${Date.now()}`);
      await setDoc(docRef, {
        ...prepareFoodData(customFood),
        userId: user.uid,
        status: "pending",
        submittedAt: new Date().toISOString(),
      });
      Alert.alert("Submitted", "Your meal will appear once approved by admin.");
      setShowCustomModal(false);
      setCustomFood({
        name: "",
        calories: "",
        protein: "",
        carbs: "",
        fats: "",
        vitaminC: "",
        calcium: "",
        iron: "",
        potassium: "",
        fiber: "",
        sugar: "",
      });
    } catch (err) {
      console.error("Custom food error:", err);
      Alert.alert("Error", "Failed to submit custom food.");
    }
  };

  const searchFood = async () => {
    try {
      console.log("🔍 Searching:", searchTerm);
      const usdaResponse = await fetch(
        `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${API_KEY}&query=${searchTerm}`
      );
      const usdaData = await usdaResponse.json();

      const usdaResults = (usdaData.foods || []).map((food) => ({
        id: `usda-${food.fdcId}`,
        name: food.description,
        source: "USDA",
        calories: food.foodNutrients?.find((n) => n.nutrientName === "Energy")?.value || 0,
        protein: food.foodNutrients?.find((n) => n.nutrientName === "Protein")?.value || 0,
        carbs: food.foodNutrients?.find((n) => n.nutrientName === "Carbohydrate, by difference")?.value || 0,
        fats: food.foodNutrients?.find((n) => n.nutrientName === "Total lipid (fat)")?.value || 0,
        foodNutrients: food.foodNutrients || [],
      }));

      const snapshot = await getDocs(collection(db, "malaysianFoods"));
      const malaysianResults = snapshot.docs
        .map((doc) => ({ id: `mal-${doc.id}`, ...doc.data(), source: "Malaysia" }))
        .filter((food) => food.name.toLowerCase().includes(searchTerm.toLowerCase()));

      setSearchResults([...usdaResults, ...malaysianResults]);
    } catch (error) {
      console.error("Search error:", error);
      Alert.alert("Error", "Failed to fetch food data.");
    }
  };

  const confirmAddMeal = async () => {
    if (!user || !selectedFood) return;
    const date = new Date().toISOString().split("T")[0];
    const mealRef = doc(db, "users", user.uid, "meals", date);
    const mealData = prepareFoodData(selectedFood);

    try {
      const mealDoc = await getDoc(mealRef);
      if (!mealDoc.exists()) {
        await setDoc(mealRef, {
          [mealType]: { items: [mealData], totalCalories: mealData.calories },
        });
      } else {
        await updateDoc(mealRef, {
          [`${mealType}.items`]: arrayUnion(mealData),
          [`${mealType}.totalCalories`]: increment(mealData.calories),
        });
      }
      Alert.alert("Success", `${mealData.name} added to ${mealType}`);
      setSearchResults([]);
    } catch (error) {
      console.error("Add meal error:", error);
      Alert.alert("Error", "Failed to add meal.");
    }
    setShowModal(false);
  };

  const handleDeleteMeal = async (itemToDelete, mealType, index) => {
    if (!user) return;
    const date = new Date().toISOString().split("T")[0];
    const mealRef = doc(db, "users", user.uid, "meals", date);

    try {
      const mealDoc = await getDoc(mealRef);
      if (!mealDoc.exists()) return;

      const data = mealDoc.data();
      const updatedItems = (data[mealType]?.items || []).filter((_, i) => i !== index);
      const updatedTotalCalories = updatedItems.reduce(
        (sum, item) => sum + (item.calories || 0),
        0
      );

      if (updatedItems.length === 0) {
        await updateDoc(mealRef, { [mealType]: deleteField() });
      } else {
        await updateDoc(mealRef, {
          [`${mealType}.items`]: updatedItems,
          [`${mealType}.totalCalories`]: updatedTotalCalories,
        });
      }
    } catch (error) {
      console.error("Delete meal error:", error);
      Alert.alert("Error", "Failed to delete meal.");
    }
  };

  return (
    <ImageBackground source={background} style={{ flex: 1 }} resizeMode="cover">
      <ScrollView contentContainerStyle={styles.overlay}>
        <Text style={styles.header}>Add Meal</Text>

        <TextInput
          placeholder="Search food..."
          value={searchTerm}
          onChangeText={setSearchTerm}
          style={styles.input}
        />
        <TouchableOpacity onPress={searchFood} style={styles.button}>
          <Text style={styles.buttonText}>Search</Text>
        </TouchableOpacity>

        <View style={styles.mealTypeContainer}>
          {["breakfast", "lunch", "dinner", "snacks"].map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.mealTypeButton,
                mealType === type && styles.selectedMealType,
              ]}
              onPress={() => {
                setMealType(type);
                setSearchResults([]);
              }}
            >
              <Text style={styles.buttonText}>{type}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          onPress={() => setShowCustomModal(true)}
          style={styles.button}
        >
          <Text style={styles.buttonText}>Can't find your food? Add it manually</Text>
        </TouchableOpacity>

        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const data = prepareFoodData(item) || {};
            return (
              <TouchableOpacity
                onPress={() => {
                  setSelectedFood(item);
                  setShowModal(true);
                }}
                style={styles.resultItem}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: "bold" }}>
                    {item.name} ({item.source})
                  </Text>
                  <Text>
                    Calories: {data.calories} kcal | Protein: {data.protein} g | Carbs: {data.carbs} g | Fats: {data.fats} g
                  </Text>
                </View>
                <Ionicons name="add-circle-outline" size={24} color="green" />
              </TouchableOpacity>
            );
          }}
        />
      </ScrollView>
    </ImageBackground>
  );
}


const styles = StyleSheet.create({
  overlay: {
    padding: 20,
    paddingBottom: 120,
    //backgroundColor: 'rgba(255,255,255,0.95)',
  },
  header: {
    fontSize: 24,
    fontWeight: "700",
    color: "#6C63FF",
    marginBottom: 14,
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    marginBottom: 10,
  },
  button: {
    backgroundColor: "#6C63FF",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
  mealTypeContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 12,
  },
  mealTypeButton: {
    backgroundColor: "#ccc",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  selectedMealType: {
    backgroundColor: "#6C63FF",
  },
  resultItem: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  summary: {
    marginTop: 20,
  },
  summaryHeader: {
    fontSize: 18,
    fontWeight: "600",
    color: "#6C63FF",
    marginBottom: 10,
  },
  mealItem: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 1,
  },
  totalsContainer: {
    marginTop: 16,
    backgroundColor: "#f9f9ff",
    padding: 12,
    borderRadius: 10,
  },
  microsText: {
    fontSize: 12,
    color: "#555",
    marginTop: 4,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 14,
    width: "90%",
    alignSelf: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#6C63FF",
    marginBottom: 14,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  modalButton: {
    backgroundColor: "#6C63FF",
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
    alignItems: "center",
  },
  footerCard: {
  backgroundColor: "#fff",
  borderRadius: 16,
  padding: 16,
  marginBottom: 20,
  shadowColor: "#000",
  shadowOpacity: 0.08,
  shadowOffset: { width: 0, height: 2 },
  shadowRadius: 4,
  elevation: 2,
},
footerTitle: {
  fontSize: 16,
  fontWeight: "600",
  color: "#6C63FF",
  marginBottom: 10,
},
mealName: {
  fontWeight: "bold",
  fontSize: 14,
  marginBottom: 4,
  color: "#333",
},
nutrientText: {
  fontSize: 13,
  color: "#444",
  marginBottom: 2,
},

});
