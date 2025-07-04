export function parseMealQuery(input) {
  const query = input.toLowerCase();

  // Extract meal type
  let mealType = 'lunch'; // default fallback
  if (query.includes('breakfast')) mealType = 'breakfast';
  else if (query.includes('dinner')) mealType = 'dinner';
  else if (query.includes('snack')) mealType = 'snacks';

  // Extract calorie target
  const caloriesMatch = query.match(/under\s?(\d{2,4})\s?calories?/);
  const maxCalories = caloriesMatch ? parseInt(caloriesMatch[1]) : 600;

  // Extract macro preference
  let macroPreference = null;
  if (query.includes('low carb') || query.includes('low-carb')) macroPreference = 'low-carb';
  else if (query.includes('high protein') || query.includes('high-protein')) macroPreference = 'high-protein';
  else if (query.includes('low fat') || query.includes('low-fat')) macroPreference = 'low-fat';

  // Optional: extract dietary tags
  const dietaryTags = [];
  if (query.includes('vegetarian')) dietaryTags.push('vegetarian');
  if (query.includes('vegan')) dietaryTags.push('vegan');
  if (query.includes('dairy free') || query.includes('dairy-free')) dietaryTags.push('dairy-free');

  return {
    mealType,
    maxCalories,
    macroPreference,
    dietaryTags,
  };
}
