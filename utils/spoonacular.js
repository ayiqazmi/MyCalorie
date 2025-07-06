const GEMINI_API_KEY = "AIzaSyAuHGnP9O4bqSx4VnhFTQVPD27XieTEx3Q";

export async function getRecipeDetails(query) {
  try {
    // 🔍 Step 0: Clean the query using keywords
    const keywords = query
      .toLowerCase()
      .replace(/\b(with|and|of|a|an|the)\b/gi, '')  // remove common filler words
      .replace(/\s+/g, ' ')                         // collapse multiple spaces
      .trim()                                       // remove leading/trailing spaces
      .split(' ')
      .filter(word => word.length > 2)              // skip short/noisy words
      .join(' ');

    console.log("[Gemini] Searching with keywords:", keywords);

    // 🔥 Step 1: Prepare prompt for Gemini
const prompt = `
Provide detailed recipe information for "${keywords}" as valid JSON only.
No explanations, no markdown, no comments.
Return in this exact format:

{
  "title": "",
  "image": "",
  "summary": "",
  "instructions": "",
  "readyInMinutes": "",
  "servings": ""
}
`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    const data = await res.json();

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

// Debug raw output
console.log("[Gemini Raw Output]", text);

    // Step 2: Parse JSON safely
    let recipe = null;
    try {
  let cleaned = text.trim();

  // Remove markdown code block syntax if present
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/```json/i, "").replace(/```/g, "").trim();
  }

  recipe = JSON.parse(cleaned);
    } catch (err) {
      console.error("[Gemini Error] Failed to parse JSON:", err, "Raw text:", text);
      return null;
    }

    return recipe;

  } catch (err) {
    console.error("[Gemini Error] Failed to fetch recipe:", err);
    return null;
  }
}
