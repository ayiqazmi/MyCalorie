export function filterFoodsByUserNeeds(foods, allergies = [], healthComplications = []) {
  return foods.filter(food => {
    const name = (food.name || '').toLowerCase();
    const ingredients = (food.ingredients || '').toLowerCase();

    // ❌ Filter based on allergies
    for (const allergen of allergies) {
      if (name.includes(allergen.toLowerCase()) || ingredients.includes(allergen.toLowerCase())) {
        return false;
      }
    }

    // ⚠️ Optional: Extend this for complications in the future

    return true;
  });
}
