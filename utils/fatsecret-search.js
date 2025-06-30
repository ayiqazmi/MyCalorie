//import { getFatSecretToken } from "./fatsecret-auth";

export async function searchFatSecretFoods(query) {
  const proxyUrl = 'https://us-central1-my-calorie-fyp.cloudfunctions.net/searchFatSecret';

  try {
    const response = await fetch(`${proxyUrl}?query=${encodeURIComponent(query)}`);
    if (!response.ok) {
      console.warn(`[FatSecret Proxy] Failed request for "${query}": ${response.status}`);
      return [];
    }

    const data = await response.json();
    console.log(`[FatSecret Proxy] Response for "${query}":`, data);
    return data;
  } catch (error) {
    console.error(`[FatSecret Proxy] Error fetching "${query}":`, error.message);
    return [];
  }
}


