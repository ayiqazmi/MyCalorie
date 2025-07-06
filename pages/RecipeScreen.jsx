import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  ActivityIndicator,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
} from 'react-native';
import { getRecipeDetails } from '../utils/spoonacular';
import background from '../assets/background.png';
  import MealImage from '../utils/MealImage';

export default function RecipeScreen({ route, navigation }) {
  const { query } = route.params;
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    async function fetchRecipe() {
      setRecipe(null);
      setSuggestions([]);
      setLoading(true);

      try {
        // Try Spoonacular
        const spoonData = await getRecipeDetails(query);
        if (spoonData) {
          setRecipe({ ...spoonData, source: "Spoonacular" });
          return;
        }

        // AskMealAI fallback
        const response = await fetch("https://us-central1-my-calorie-fyp.cloudfunctions.net/askMealAI", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: query }),
        });

        const raw = await response.text();
        let data;
        try {
          data = JSON.parse(raw);
        } catch (e) {
          console.warn("[RecipeScreen] AskMealAI JSON parse error:", e);
          throw new Error("Invalid response from AskMealAI");
        }

        if (data?.title) {
          setRecipe({
            title: data.title,
            image: data.image || `https://source.unsplash.com/600x400/?food,${encodeURIComponent(query)}`,
            readyInMinutes: data.readyInMinutes || null,
            servings: data.servings || null,
            instructions: data.instructions || data.steps || "No instructions provided.",
            source: "AskMealAI",
          });
          return;
        }

        // Get fallback food names
        const suggestRes = await fetch(`https://api.spoonacular.com/recipes/complexSearch?query=${encodeURIComponent(query)}&number=5&apiKey=YOUR_SPOONACULAR_API_KEY`);
        const suggestData = await suggestRes.json();
        if (suggestData?.results?.length) {
          setSuggestions(suggestData.results.map(r => r.title));
        }
      } catch (err) {
        console.warn(`[RecipeScreen] Failed to get recipe for "${query}":`, err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchRecipe();
  }, [query]);

const renderInstructions = (instructions) => {
  if (!instructions?.length) {
    return <Text style={styles.noSteps}>No instructions provided.</Text>;
  }

  return instructions.map((item, index) => (
    <View key={index} style={styles.stepContainer}>
      <Text style={styles.stepNumber}>{`${item.step ?? index + 1}. `}</Text>
      <Text style={styles.stepText}>
        {typeof item.instruction === 'string'
          ? item.instruction.trim()
          : 'No instruction provided.'}
      </Text>
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

  if (!recipe && suggestions.length === 0) {
    return (
      <View style={styles.loaderContainer}>
        <Text style={styles.notFound}>No recipe found for "{query}"</Text>
      </View>
    );
  }

  if (!recipe && suggestions.length > 0) {
    return (
      <View style={styles.loaderContainer}>
        <Text style={styles.notFound}>No exact recipe found for "{query}".</Text>
        <Text style={{ fontWeight: 'bold', marginTop: 10 }}>Did you mean:</Text>
        {suggestions.map((title, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => navigation.replace('RecipeScreen', { query: title })}
          >
            <Text style={{ color: '#6C63FF', marginTop: 4 }}>{title}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }
  return (
    
    <ImageBackground source={background} style={{ flex: 1 }} resizeMode="cover">
      <ScrollView contentContainerStyle={styles.container}>
        <MealImage  mealName={recipe?.title} style={styles.image} />
        
        <Text style={styles.title}>{recipe.title}</Text>
        <Text style={styles.source}>Source: {recipe.source}</Text>
        <Text style={styles.subtitle}>
          {recipe.readyInMinutes ? `Ready in ${recipe.readyInMinutes} mins` : ''} 
          {recipe.servings ? ` · Serves ${recipe.servings}` : ''}
        </Text>

        <Text style={styles.instructionHeader}>📋 Instructions</Text>
        
        {renderInstructions(recipe?.instructions)}
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
