//askMeal Ai gpt

import { fetchUSDAFoods } from './fetchFoodData';
import { fetchMalaysianFoodsFromFirestore } from './fetchFoodData';

export async function askMealAI(prompt) {
  try {
    const res = await fetch('https://us-central1-my-calorie-fyp.cloudfunctions.net/askMealAI', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });

    const raw = await res.text();
    console.log('[askMealAI] raw response:', raw);
    const filters = JSON.parse(raw);

    // ✅ Add fallback for missing keywords
    const keyword = filters.includeKeywords?.[0] || 'healthy';
    const usdaFoods = await fetchUSDAFoods(keyword, { useCache: false });

    const malaysianFoods = await fetchMalaysianFoodsFromFirestore(filters.mealType || '');

    const combined = [...usdaFoods, ...malaysianFoods];

    const filtered = combined.filter(food =>
      (!filters.maxCalories || food.calories <= filters.maxCalories) &&
      (!filters.includeKeywords?.length || filters.includeKeywords.some(k =>
        food.name.toLowerCase().includes(k)
      ))
    );

    return filtered.slice(0, 5);
  } catch (error) {
    console.error('[askMealAI] error:', error);
    return [];
  }
}


