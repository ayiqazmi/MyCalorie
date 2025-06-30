const SPOONACULAR_API_KEY = "42dd92b6a85c47d5a83e3dd22dd226d2";

export async function getRecipeDetails(query) {
  try {
    // 🔍 Step 0: Clean the query using keywords
    const keywords = query
      .toLowerCase()
      .replace(/(with|and|of|a|an|the)/gi, '')  // remove common filler words
      .split(' ')
      .filter(word => word.length > 2)         // skip short/noisy words
      .join(' ');

    console.log("[Spoonacular] Searching with keywords:", keywords);

    // Step 1: Search for the recipe
    const searchRes = await fetch(
      `https://api.spoonacular.com/recipes/complexSearch?query=${encodeURIComponent(keywords)}&number=1&apiKey=${SPOONACULAR_API_KEY}`
    );
    const searchData = await searchRes.json();

    if (!searchData.results || searchData.results.length === 0) return null;

    const recipeId = searchData.results[0].id;

    // Step 2: Get detailed recipe info
    const detailRes = await fetch(
      `https://api.spoonacular.com/recipes/${recipeId}/information?includeNutrition=false&apiKey=${SPOONACULAR_API_KEY}`
    );
    const recipe = await detailRes.json();

    return {
      title: recipe.title,
      image: recipe.image,
      summary: recipe.summary,
      instructions: recipe.instructions,
      readyInMinutes: recipe.readyInMinutes,
      servings: recipe.servings,
    };
  } catch (err) {
    console.error("[Spoonacular Error] Failed to fetch recipe:", err);
    return null;
  }
}
