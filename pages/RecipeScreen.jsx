import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, ActivityIndicator, StyleSheet } from 'react-native';
import { getRecipeDetails } from '../utils/spoonacular';

export default function RecipeScreen({ route }) {
  const { query } = route.params;
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecipe() {
      try {
        const spoonData = await getRecipeDetails(query);
        if (!spoonData) throw new Error("No recipe found");

        setRecipe({ ...spoonData, source: "Spoonacular" });
      } catch (err) {
        console.warn(`[RecipeScreen] Failed to get recipe for "${query}":`, err.message);
        setRecipe(null);
      } finally {
        setLoading(false);
      }
    }

    fetchRecipe();
  }, [query]);

  function renderInstructions(instructions) {
    const matches = instructions?.match(/<li>(.*?)<\/li>/g);
    if (matches?.length) {
      return matches.map((item, index) => (
        <View key={index} style={styles.stepContainer}>
          <Text style={styles.stepNumber}>{`${index + 1}. `}</Text>
          <Text style={styles.stepText}>{item.replace(/<\/?li>/g, '').trim()}</Text>
        </View>
      ));
    }

    const steps = instructions?.split(/(?<=\.)\s+(?=[A-Z])/g)?.filter(s => s.trim());
    if (!steps?.length) return <Text>No instructions provided.</Text>;

    return steps.map((step, index) => (
      <View key={index} style={styles.stepContainer}>
        <Text style={styles.stepNumber}>{`${index + 1}. `}</Text>
        <Text style={styles.stepText}>{step.trim()}</Text>
      </View>
    ));
  }

  if (loading) return <ActivityIndicator style={{ marginTop: 50 }} size="large" color="#6C63FF" />;
  if (!recipe) return <Text style={{ margin: 20 }}>No recipe found for "{query}"</Text>;

  return (
    <ScrollView style={styles.container}>
      <Image source={{ uri: recipe.image }} style={styles.image} />
      <Text style={styles.title}>{recipe.title}</Text>
      <Text style={styles.source}>Source: {recipe.source}</Text>
      <Text style={styles.subtitle}>
        {recipe.readyInMinutes ? `Ready in ${recipe.readyInMinutes} mins` : ''} 
        {recipe.servings ? ` · Serves ${recipe.servings}` : ''}
      </Text>
      {renderInstructions(recipe.instructions || "No instructions provided.")}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  image: { width: '100%', height: 200, borderRadius: 12, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#777', marginBottom: 12 },
  source: { fontSize: 12, color: '#999', marginBottom: 8 },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  stepNumber: { fontSize: 16, lineHeight: 22, marginRight: 8 },
  stepText: { flex: 1, fontSize: 16, lineHeight: 22 },
});
