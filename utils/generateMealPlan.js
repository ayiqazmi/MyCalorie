import { getUSDAFoodsBasedOnGoal, fetchMalaysianFoodsFromFirestore } from './fetchFoodData';
import { filterFoodsByUserNeeds } from './filterFoods';

const shuffleArray = (array) => array.sort(() => Math.random() - 0.5);

const getMealMacros = (totalCalories) => ({
  calories: totalCalories,
  protein: totalCalories * 0.3 / 4,
  carbs: totalCalories * 0.4 / 4,
  fat: totalCalories * 0.3 / 9,
});

const scoreFood = (food, target) => {
  if (!food.calories || !food.protein || !food.carbs || !food.fat) return 0;

  const calDiff = Math.abs(food.calories - target.calories);
  const proteinDiff = Math.abs(food.protein - target.protein);
  const carbDiff = Math.abs(food.carbs - target.carbs);
  const fatDiff = Math.abs(food.fat - target.fat);

  return 1000 - (calDiff + proteinDiff * 4 + carbDiff * 2 + fatDiff * 7);
};

function shuffleArrayWithSeed(array, seed) {
  const result = [...array];
  let currentIndex = result.length, temporaryValue, randomIndex;

  // Seeded random generator (simple LCG)
  const random = (() => {
    let m = 0x80000000;
    let a = 1103515245;
    let c = 12345;
    let state = seed % m;
    return () => (state = (a * state + c) % m) / m;
  })();

  while (0 !== currentIndex) {
    randomIndex = Math.floor(random() * currentIndex);
    currentIndex--;

    temporaryValue = result[currentIndex];
    result[currentIndex] = result[randomIndex];
    result[randomIndex] = temporaryValue;
  }

  return result;
}


export async function generateMealPlan(userProfile, variantKey = Date.now()) {
  const {
    allergies,
    healthComplications,
    caloriesGoal,
    healthGoal,
  } = userProfile;

  if (!caloriesGoal || !healthGoal) {
    throw new Error('Missing user calorie goal or health goal');
  }

  const mealRatios = {
    breakfast: 0.25,
    lunch: 0.35,
    dinner: 0.3,
    snacks: 0.1,
  };

  const mealTargets = Object.fromEntries(
    Object.entries(mealRatios).map(([meal, ratio]) => [
      meal,
      caloriesGoal * ratio,
    ])
  );

  let usdaFoods = [];
  let malaysianFoods = [];

  try {
    usdaFoods = await getUSDAFoodsBasedOnGoal(healthGoal);
    console.log('[USDA] Search-based foods:', usdaFoods.length);
  } catch (err) {
    console.warn('[USDA] Search error:', err.message);
  }

  try {
    malaysianFoods = await fetchMalaysianFoodsFromFirestore();
    console.log('[Malaysia] Foods fetched:', malaysianFoods.length);
  } catch (err) {
    console.warn('[Malaysia] Fetch error:', err.message);
  }

  let foods = [...usdaFoods, ...malaysianFoods];
  let filteredFoods = filterFoodsByUserNeeds(foods, allergies, healthComplications);
filteredFoods = shuffleArrayWithSeed(filteredFoods, variantKey);

  if (filteredFoods.length < 10) {
    console.warn('Fallback: too few filtered foods, using top unfiltered.');
    filteredFoods = shuffleArray([...foods]).slice(0, 10);
  }

  const usedNames = new Set();

  const generateSmartMeal = (foods, targetCalories) => {
    const target = getMealMacros(targetCalories);

    const scored = foods
      .filter(food => !usedNames.has(food.name?.toLowerCase()))
      .map(food => ({ food, score: scoreFood(food, target) }))
      .sort((a, b) => b.score - a.score);

    const meal = [];
    let totalCalories = 0;

    for (const { food } of scored) {
      const name = food.name?.toLowerCase();
      if (usedNames.has(name)) continue;

      if (totalCalories + food.calories <= targetCalories) {
        meal.push(food);
        totalCalories += food.calories;
        usedNames.add(name);
      }

      if (totalCalories >= targetCalories * 0.9) break;
    }

    return meal;
  };

  const plan = {
  breakfast: generateSmartMeal(filteredFoods, mealTargets.breakfast),
  lunch: generateSmartMeal(filteredFoods, mealTargets.lunch),
  dinner: generateSmartMeal(filteredFoods, mealTargets.dinner),
  snacks: generateSmartMeal(filteredFoods, mealTargets.snacks),
};

return {
  plan,
  createdAt: new Date().toISOString()
};

}
