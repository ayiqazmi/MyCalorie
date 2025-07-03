//TAK GUNA

import { fetchUSDAFoods, fetchFatSecretFoods } from './fetchFoodData';
import { filterFoodsByUserNeeds } from './filterFoods';

const macroKeywords = {
  'high-protein': ['chicken', 'eggs', 'lentils', 'tofu', 'greek yogurt', 'turkey', 'beans', 'cottage cheese'],
  'low-carb': ['chicken', 'eggs', 'avocado', 'salmon', 'tofu', 'spinach', 'cheese'],
  'low-fat': ['oats', 'zucchini', 'berries', 'banana', 'egg whites', 'broccoli'],
};

const shuffleArray = (array) => array.sort(() => Math.random() - 0.5);

export async function generateMealFromIntent(intent, userProfile = {}) {
  const {
    mealType,
    maxCalories,
    macroPreference,
    dietaryTags = [],
  } = intent;

  const { allergies = [], healthComplications = [] } = userProfile;

  const searchTerms = macroPreference
    ? macroKeywords[macroPreference] || []
    : ['chicken', 'rice', 'eggs', 'milk', 'beans', 'cheese', 'spinach', 'banana', 'tofu', 'oats']; // fallback terms

  let foods = [];

  for (const term of searchTerms) {
    try {
      const usda = await fetchUSDAFoods(term);
      let fatsecret = [];

      try {
        fatsecret = await fetchFatSecretFoods(term);
        console.log(`[FatSecret] Search result for "${term}":`, fatsecret.length);
      } catch (fsErr) {
        console.warn(`FatSecret fetch failed for "${term}":`, fsErr.message);
      }

      foods = foods.concat(usda, fatsecret);
    } catch (error) {
      console.warn(`Error fetching food data for "${term}":`, error.message);
    }
  }

  // Filter by allergy/dietary restrictions
  let filteredFoods = filterFoodsByUserNeeds(foods, allergies, healthComplications);
  filteredFoods = shuffleArray(filteredFoods);

  // Fallback if too few foods
  if (filteredFoods.length < 5) {
    console.warn('Fallback: not enough safe foods. Using unfiltered results.');
    filteredFoods = shuffleArray([...foods]).slice(0, 10);
  }

  // Score based on how close calories are to target
  const scored = filteredFoods.map((food) => {
    const calDiff = Math.abs(food.calories - maxCalories);
    const score = 1000 - calDiff;
    return { food, score };
  });

  scored.sort((a, b) => b.score - a.score);

  const selectedFoods = [];
  let totalCalories = 0;

  for (const { food } of scored) {
    if (totalCalories + food.calories <= maxCalories) {
      selectedFoods.push(food);
      totalCalories += food.calories;
    }
    if (totalCalories >= maxCalories * 0.9) break;
  }

  return selectedFoods;
}
