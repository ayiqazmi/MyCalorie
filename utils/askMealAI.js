export async function askMealAI({ mealType = 'lunch', allergies = [], healthConditions = [], targetCalories = 2000, caloriesConsumed = 0 }) {
  try {
    const remainingCalories = targetCalories - caloriesConsumed;
    const allergyList = allergies.join(', ') || 'none';
    const healthConditionList = healthConditions.join(', ') || 'none';

    const prompt = `
You are a certified nutritionist AI.

Generate a JSON array of 10 healthy foods malaysia suitable for ${mealType}, each item under ${remainingCalories > 500 ? 500 : remainingCalories} kcal, considering:

- User allergies: ${allergyList}
- User health conditions: ${healthConditionList}
- User remaining calories for the day: ${remainingCalories} kcal

Each item must follow **exactly this schema**:

[
  {
    "name": "string",
    "calories": 0,
    "carbs": 0,
    "fat": 0,
    "protein": 0,
    "fiber": 0,
    "sugar": 0,
    "sodium": 0,
    "iron": 0,
    "calcium": 0,
    "halal": true,
    "category": "${mealType}",
    "source": "malaysia"
  }
]

⚠️ Return **only** a valid JSON array — no markdown, no commentary.

Ensure all foods are:
- Safe for the user’s allergies.
- Suitable for their health conditions.
- Contributing healthily within their calorie target.
`;

    /** 2️⃣ Call Gemini */
    const key =  'AIzaSyAuHGnP9O4bqSx4VnhFTQVPD27XieTEx3Q'; // Replace or secure properly

    const url   =
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`;

    const res   = await fetch(url, {
      method : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body    : JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    const data      = await res.json();
    const rawText   = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    console.log('[askMealAI] Gemini raw →', rawText);

    /** 3️⃣  Pull out the first JSON array (handles code‑fences & chatter) */
    const jsonBlock =
      // a) fenced  ```json\n[ ... ]\n```             ⬇
      rawText.replace(/^```(?:json)?\s*|```$/gi, '').trim() ||
      // b) unfenced but has other text; grab first […] block
      (rawText.match(/\[[\s\S]*?]/) || [])[0];

    if (!jsonBlock) {
      console.warn('[askMealAI] No JSON block found');
      return [];
    }

    /** 4️⃣  Parse & return the first 5 items */
    const foods = JSON.parse(jsonBlock);
    return Array.isArray(foods) ? foods.slice(0, 5) : [];
  } catch (err) {
    console.error('[askMealAI] error:', err);
    return [];
  }
}
export async function findMealImagePexels(mealName, apiKey) {
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(mealName)}&per_page=1`;

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: apiKey,
      },
    });

    const data = await res.json();
console.log(data);
    if (data.photos && data.photos.length > 0) {
      return data.photos[0].src.medium; // You can choose small, medium, large, original
    } else {
      return 'https://via.placeholder.com/80?text=Food'; // fallback
    }
  } catch (error) {
    console.error('Error fetching from Pexels:', error);
    return 'https://via.placeholder.com/80?text=Food';
  }
}
