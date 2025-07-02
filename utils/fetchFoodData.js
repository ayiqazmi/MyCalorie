import { getFirestore, doc, setDoc, getDocs, getDoc, collection} from 'firebase/firestore';
//import { fetchUSDAFoods } from './fetchFoodData';

const db = getFirestore();
const API_KEY = 'wDuhwYZWD0jLgS1YfSEBPrEgjonLtLYMHDcT0Dk1';

export async function getUSDAFoodsBasedOnGoal(healthGoal) {
  const goalMap = {
    gain: [
      "scrambled eggs", "boiled egg", "chicken sandwich", "beef stir fry",
      "tofu curry", "lentil soup", "greek yogurt parfait", "chicken rice bowl"
    ],
    lose: [
      "vegetable soup", "grilled chicken salad", "steamed fish", "boiled eggs",
      "baked sweet potato", "fruit salad", "chicken lettuce wrap", "tofu stir fry"
    ],
    maintain: [
      "omelette", "chicken pasta", "quinoa salad", "grilled salmon",
      "banana pancake", "chicken burrito", "cooked spinach", "egg fried rice",
      "grilled vegetables", "miso soup", "protein smoothie", "tofu scramble"
    ]
  };

  const searchTerms = goalMap[healthGoal] || goalMap.maintain;

  try {
    const allResults = await Promise.all(
      searchTerms.map(async term => {
        try {
          const results = await fetchUSDAFoods(term, { useCache: false }); // 🔥 force fresh data
          console.log(`[USDA] "${term}" → ${results.length} foods`);
          return results;
        } catch (err) {
          console.error(`[USDA] Failed for "${term}":`, err.message);
          return [];
        }
      })
    );

    return allResults.flat(); // flatten the array of arrays
  } catch (err) {
    console.error('[getUSDAFoodsBasedOnGoal] Error:', err.message);
    return [];
  }
}




export async function fetchMalaysianFoodsFromFirestore() {
  try {
    const colRef = collection(db, 'malaysianFoods');
    const snapshot = await getDocs(colRef);
    const meals = [];

    snapshot.forEach(doc => {
      meals.push({
        ...doc.data(),
        id: doc.id,
        source: 'malaysia',
      });
    });

    return meals;
  } catch (err) {
    console.error('[fetchMalaysianFoodsFromFirestore] Error:', err.message);
    return [];
  }
}

export async function fetchUSDAFoods(query, options = { useCache: true }) {
  if (!query || !query.trim()) {
    console.warn('[fetchUSDAFoods] Skipped empty query');
    return [];
  }

  const useCache = options.useCache !== false;
  const cacheRef = doc(db, 'usdaCache', query.toLowerCase());

  if (useCache) {
    try {
      const cachedSnap = await getDoc(cacheRef);
      if (cachedSnap.exists()) {
        console.log(`[USDA Cache] Used cached result for "${query}"`);
        return cachedSnap.data().results || [];
      }
    } catch (err) {
      console.warn(`[USDA Cache] Failed to fetch cache for "${query}":`, err.message);
    }
  }

  // Always fetch from API
  const url = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${query}&api_key=${API_KEY}&pageSize=10`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    const items = data.foods || [];

    const formatted = items
      .filter(food =>
        food.dataType !== 'Branded' &&
        !/raw|unprepared|baby|dry|frozen/i.test(food.description) &&
        /scrambled|grilled|boiled|roasted|fried|baked|stir|salad|sandwich|soup|cooked|prepared|recipe/i.test(food.description)
      )
      .slice(0, 5)
      .map(food => {
        const nutrients = food.foodNutrients || [];

        return {
          name: food.description,
          calories: nutrients.find(n => n.nutrientName === 'Energy')?.value || 0,
          protein: nutrients.find(n => n.nutrientName === 'Protein')?.value || 0,
          carbs: nutrients.find(n => n.nutrientName === 'Carbohydrate, by difference')?.value || 0,
          fat: nutrients.find(n => n.nutrientName === 'Total lipid (fat)')?.value || 0,
          image: `https://source.unsplash.com/featured/?${query.replace(/\s+/g, ',')}`,
          source: 'USDA',
        };
      });

    // Cache it only if caching is enabled
    if (useCache) {
      try {
        await setDoc(cacheRef, {
          term: query.toLowerCase(),
          timestamp: new Date().toISOString(),
          results: formatted,
        });
        console.log(`[USDA Cache] Stored result for "${query}"`);
      } catch (err) {
        console.warn(`[USDA Cache] Failed to store result:`, err.message);
      }
    }

    return formatted;
  } catch (err) {
    console.error(`[fetchUSDAFoods] ERROR for "${query}":`, err.message);
    return [];
  }
}




// ✅ Nutrient-based dynamic USDA fetch (new)
export async function fetchUSDAFoodsByNutrients(targetMacros) {
  const query = [
    `nutrients=203:GT:${Math.floor(targetMacros.protein * 0.7)}`,  // protein > 70%
    `nutrients=204:LT:${Math.ceil(targetMacros.fat * 1.5)}`,       // fat < 150%
    `nutrients=205:LT:${Math.ceil(targetMacros.carbs * 1.5)}`,     // carbs < 150%
    `nutrients=208:LT:${Math.ceil(targetMacros.calories * 1.2)}`   // calories < 120%
  ].join('&');

  const url = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${API_KEY}&${query}&pageSize=50`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (!Array.isArray(data.foods)) return [];

    return data.foods.map(item => ({
      id: item.fdcId,
      name: item.description,
      calories: item.foodNutrients?.find(n => n.nutrientId === 208)?.value || 0,
      protein: item.foodNutrients?.find(n => n.nutrientId === 203)?.value || 0,
      carbs: item.foodNutrients?.find(n => n.nutrientId === 205)?.value || 0,
      fat: item.foodNutrients?.find(n => n.nutrientId === 204)?.value || 0,
      source: 'USDA',
    }));
  } catch (err) {
    console.error('[fetchUSDAFoodsByNutrients] Error:', err);
    return [];
  }
}

