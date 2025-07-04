import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { fetchUSDAFoods, fetchMalaysianFoodsFromFirestore } from '../../utils/fetchFoodData'; // ✅ import the right module

export default function SearchMealModal({ mealType, onSelectMeal, onClose }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);

    try {
      // Firestore: Malaysian Foods
      const malaysianResults = await fetchMalaysianFoodsFromFirestore();
      const filteredMalaysian = malaysianResults.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );

      // USDA API
      const usdaResults = await fetchUSDAFoods(searchQuery);

      setResults([...filteredMalaysian, ...usdaResults]);
    } catch (err) {
      console.error('[Search] Error:', err.message);
    }

    setLoading(false);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => onSelectMeal(mealType, item)}>
      <Image source={{ uri: item.image || 'https://via.placeholder.com/80' }} style={styles.image} />
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.source}>{item.source === 'malaysia' ? '🇲🇾 Malaysian DB' : '🇺🇸 USDA API'}</Text>
        <Text style={styles.nutrition}>Calories: {item.calories ?? 0} kcal</Text>
        <Text style={styles.nutrition}>Protein: {item.protein ?? 0} g</Text>
        <Text style={styles.nutrition}>Carbs: {item.carbs ?? 0} g</Text>
        <Text style={styles.nutrition}>Fats: {item.fats ?? 0} g</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Search Replacement for {mealType.toUpperCase()}</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Chicken, Nasi Lemak"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
        <Text style={styles.searchBtnText}>🔍 Search</Text>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator color="#6C63FF" size="large" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item, index) => `${item.name}_${index}`}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      )}

      <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
        <Text style={styles.closeText}>❌ Close</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#1E2A38' },
  heading: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 10 },
  input: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  searchBtn: {
    backgroundColor: '#6C63FF',
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
    marginBottom: 20,
  },
  searchBtnText: { color: '#fff', fontWeight: 'bold' },
  card: {
    flexDirection: 'row',
    backgroundColor: '#2A3C53',
    padding: 10,
    borderRadius: 12,
    marginBottom: 12,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginRight: 10,
  },
  name: { fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  source: { color: '#A8C1FF', marginBottom: 6 },
  nutrition: { color: '#ccc', fontSize: 12 },
  closeBtn: {
    padding: 12,
    alignItems: 'center',
    backgroundColor: '#444',
    borderRadius: 10,
    marginTop: 10,
  },
  closeText: { color: 'white' },
});
