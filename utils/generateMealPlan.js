/* ------------------------------------------------------------------ */
/*  Utility: quick hash to turn variantKey into a short id            */
/* ------------------------------------------------------------------ */
function hashKey(key) {
  let h = 0;
  const str = String(key);
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0; // 32‑bit
  }
  return Math.abs(h).toString(36).slice(0, 6); // e.g. "4d2f1b"
}

/* ------------------------------------------------------------------ */
/*  Build a unique daily prompt                                       */
/* ------------------------------------------------------------------ */
function buildPrompt(
  { caloriesGoal, allergies, healthGoal, healthComplications }: {
    caloriesGoal: number;
    allergies: string[];
    healthGoal: string;
    healthComplications: string[];
  },
  dateKey: string,          // e.g. “2025‑07‑04”
  variantKey: string        // any string that indicates the requested “version”
) {
  const planId = hashKey(variantKey);  // 👉🏽 your own hash util

  return `
You are a certified Malaysian dietitian. Design a **brand‑new** full‑day meal plan for **${dateKey}** (plan‑id: ${planId}) totalling **≈${caloriesGoal} kcal**.

### Structure & macro split
- Breakfast  (25 %)
- Lunch      (35 %)
- Dinner     (30 %)
- Snacks     (10 %)

### Strict output schema
Return **only** minified JSON:
\`\`\`json
{
  "breakfast":[{"name":"","image","calories":0,"protein":0,"carbs":0,"fat":0}],
  "lunch":    [ … ],
  "dinner":   [ … ],
  "snacks":   [ … ]
}
\`\`\`

### Culinary rules
1. Use **distinctly Malaysian dishes** or creative local twists (e.g. _Nasi Lemak Quinoa_, _Roti Canai Wrap_, _Tempeh Rendang_).
2. Rotate dishes so that no item repeats within the same **week** or across different **plan‑ids**.
3. Ingredients must be easy to find in Malaysian grocery stores or pasar tani.
4. Clearly reflect any constraints:
   • Allergies  : ${allergies.length ? allergies.join(', ') : 'none'}
   • Health goal: ${healthGoal}
   • Complications: ${healthComplications.length ? healthComplications.join(', ') : 'none'}

### Uniqueness guard
Compare against the implicit memory of previous ${dateKey} or plan‑id values and ensure **at least 80 %** of dish names differ.

ONLY reply with valid JSON — no comments, markdown, or extra keys.
`.trim();
}
/* ------------------------------------------------------------------ */
/*  Normalisers & helpers                                             */
/* ------------------------------------------------------------------ */
const safeArr = v => (Array.isArray(v) ? v : []);

function normalizePlan(raw) {
  return {
    breakfast: safeArr(raw.breakfast),
    lunch:     safeArr(raw.lunch),
    dinner:    safeArr(raw.dinner),
    snacks:    safeArr(raw.snacks || raw.snack),
  };
}

const isPlanEmpty = plan => Object.values(plan).every(a => !a.length);

async function fetchAIPlan(prompt) {
  try {
    const res  = await fetch('https://us-central1-my-calorie-fyp.cloudfunctions.net/askMealAI', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    const raw  = await res.text();
    console.log('[fetchAIPlan] Raw:', raw);
    const json = JSON.parse(raw);
    return typeof json === 'object' && !Array.isArray(json) ? json : null;
  } catch (err) {
    console.error('[fetchAIPlan] Error:', err);
    return null;
  }
}

/* ------------------------------------------------------------------ */
/*  Main export                                                       */
/* ------------------------------------------------------------------ */
import { format } from 'date-fns';   // if you already have date‑fns in project

export async function generateMealPlan(userProfile, variantKey = Date.now()) {
  const dateKey = format(new Date(variantKey), 'yyyy‑MM‑dd');  // e.g. “2025‑07‑04”
  const prompt  = buildPrompt(userProfile, dateKey, variantKey);

  console.log('[MealPlan] Prompt:', prompt);

  let plan  = {};
  let tries = 0;

  while (tries < 3) {
    const raw = await fetchAIPlan(prompt);
    plan      = raw ? normalizePlan(raw) : {};
    if (!isPlanEmpty(plan)) break;
    console.warn(`[MealPlan] Try ${tries + 1}: empty plan, retrying…`);
    tries++;
  }

  if (isPlanEmpty(plan)) {
    throw new Error('Meal plan is empty after 3 attempts');
  }

  return {
    plan,
    createdAt: new Date().toISOString(),
    dateKey,              // handy to store alongside plan
    planId: hashKey(variantKey),
  };
}
