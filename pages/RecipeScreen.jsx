import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  ActivityIndicator,
  StyleSheet,
  ImageBackground,
} from 'react-native';
import { getRecipeDetails } from '../utils/spoonacular';
import background from '../assets/background.png';

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

  const renderInstructions = (instructions) => {
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
    if (!steps?.length) return <Text style={styles.noSteps}>No instructions provided.</Text>;

    return steps.map((step, index) => (
      <View key={index} style={styles.stepContainer}>
        <Text style={styles.stepNumber}>{`${index + 1}. `}</Text>
        <Text style={styles.stepText}>{step.trim()}</Text>
      </View>
    ));
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#6C63FF" />
        <Text style={styles.loadingText}>Loading recipe...</Text>
      </View>
    );
  }

  if (!recipe) {
    return (
      <View style={styles.loaderContainer}>
        <Text style={styles.notFound}>No recipe found for "{query}"</Text>
      </View>
    );
  }

  return (
    <ImageBackground source={background} style={{ flex: 1 }} resizeMode="cover">
      <ScrollView contentContainerStyle={styles.container}>
        <Image source={{ uri: recipe.image }} style={styles.image} />
        <Text style={styles.title}>{recipe.title}</Text>
        <Text style={styles.source}>Source: {recipe.source}</Text>
        <Text style={styles.subtitle}>
          {recipe.readyInMinutes ? `Ready in ${recipe.readyInMinutes} mins` : ''} 
          {recipe.servings ? ` · Serves ${recipe.servings}` : ''}
        </Text>

        <Text style={styles.instructionHeader}>📋 Instructions</Text>
        {renderInstructions(recipe.instructions || "No instructions provided.")}
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255,255,255,0.93)',
    padding: 20,
    paddingBottom: 80,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#6C63FF',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  source: {
    fontSize: 12,
    color: '#999',
    marginBottom: 6,
  },
  instructionHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stepNumber: {
    fontSize: 16,
    color: '#6C63FF',
    fontWeight: '600',
    marginRight: 6,
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#6C63FF',
    fontSize: 14,
  },
  notFound: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  noSteps: {
    fontSize: 14,
    color: '#999',
  },
});
