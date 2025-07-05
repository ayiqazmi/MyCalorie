export async function askMealAI(mealType = 'lunch') {
  try {
    /** 1️⃣ Build a very explicit prompt */
    const prompt = `
Give me a JSON array of 10 healthy foods for ${mealType} or like ${mealType}, each under 500 kcal.

Each item must follow exactly this schema  ⬇
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

⚠️ Return **only** a valid JSON array — no markdown, no commentary.
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
