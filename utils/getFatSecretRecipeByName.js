import { searchFatSecretFoods } from './fatsecret-search';
import { getFatSecretFoodDetails } from './getFatSecretFoodDetails';

/**
 * Given a food name (e.g., "chicken rice"), returns detailed recipe info from FatSecret.
 * Returns null if no match or details found.
 */
export async function getFatSecretRecipeByName(foodName) {
  try {
    console.log(`[DEBUG] Searching FatSecret for: "${foodName}"`);
    const results = await searchFatSecretFoods(foodName);
    console.log(`[DEBUG] FatSecret returned ${results?.length || 0} result(s)`);

    if (!results || results.length === 0) {
      console.warn(`[FatSecret] No results found for "${foodName}"`);
      return null;
    }

    const topMatch = results[0];
console.log(`[DEBUG] Using food_id ${topMatch.food_id} for "${topMatch.name}"`);
    const foodId = topMatch.food_id;

    const details = await getFatSecretFoodDetails(foodId);

    if (!details) {
      console.warn(`[FatSecret] No detailed info found for food_id ${foodId}`);
      return null;
    }

    return details;
  } catch (err) {
    console.error(`[FatSecret] Error while fetching recipe for "${foodName}":`, err.message);
    return null;
  }
}
