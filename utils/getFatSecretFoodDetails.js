import { getFatSecretToken } from './fatsecret-auth';

export async function getFatSecretFoodDetails(foodIdOrName) {
  const accessToken = await getFatSecretToken();

  const formBody = new URLSearchParams();
  formBody.append('format', 'json'); // ✅ THIS IS CRITICAL
  formBody.append('method', 'food.get');
  formBody.append('food_id', foodIdOrName);

  const response = await fetch('https://platform.fatsecret.com/rest/server.api', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formBody.toString(),
  });

  const data = await response.json(); // now this won't break
  return data.food;
}
