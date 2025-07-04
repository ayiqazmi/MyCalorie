require('dotenv').config(); // ✅ Load .env variables

const functions = require('firebase-functions');
const cors = require('cors')({ origin: true });
const OpenAI = require('openai');
const admin = require('firebase-admin');

admin.initializeApp();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // ✅ Secure, no hardcoding
});

// ====== adminDeleteUser ======
exports.adminDeleteUser = functions.https.onCall(async (data, context) => {
  const uid = data.uid;
  if (!uid) return { success: false, error: "Missing UID" };

  try {
    await admin.firestore().collection('users').doc(uid).delete();
    await admin.auth().deleteUser(uid);
    return { success: true };
  } catch (error) {
    console.error('adminDeleteUser error:', error);
    return { success: false, error: error.message };
  }
});

// ====== promoteToAdmin ======
exports.promoteToAdmin = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'You must be signed in.');
  }

  const callerUid = context.auth.uid;
  const callerUser = await admin.auth().getUser(callerUid);
  const callerClaims = callerUser.customClaims || {};

  if (!callerClaims.isAdmin) {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can promote users.');
  }

  const targetUid = data.uid;
  if (!targetUid) {
    throw new functions.https.HttpsError('invalid-argument', 'Target UID is required.');
  }

  try {
    await admin.auth().setCustomUserClaims(targetUid, { isAdmin: true });
    await admin.firestore().collection('users').doc(targetUid).set({ isAdmin: true }, { merge: true });
    return { success: true, message: `User ${targetUid} promoted to admin.` };
  } catch (error) {
    console.error('promoteToAdmin error:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// ====== askMealAI ======
exports.askMealAI = functions.https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'POST') return res.status(405).send('Only POST allowed');

    const { prompt } = req.body;
    if (!prompt) return res.status(400).send('Missing prompt');

    const systemMsg = `
You are a smart assistant that helps extract structured meal filters from user prompts.

Always output a valid JSON object with the following fields:
{
  "mealType": "breakfast" | "lunch" | "dinner" | "snacks",
  "maxCalories": number,
  "includeKeywords": string[]
}

Rules:
- "includeKeywords" must always contain at least one descriptive food term
- Use generic terms like ["healthy"] if not specified
- "mealType" should be one of: breakfast, lunch, dinner, snacks
- "maxCalories" should be extracted or estimated
- Do not return explanation — just pure JSON

Examples:

Prompt: "I want a light dinner under 400 calories"
Output: { "mealType": "dinner", "maxCalories": 400, "includeKeywords": ["light"] }

Prompt: "high protein breakfast below 600 calories"
Output: { "mealType": "breakfast", "maxCalories": 600, "includeKeywords": ["high protein"] }

Prompt: "snack with fruit and under 200 calories"
Output: { "mealType": "snacks", "maxCalories": 200, "includeKeywords": ["fruit"] }

Prompt: "lunch"
Output: { "mealType": "lunch", "maxCalories": 500, "includeKeywords": ["healthy"] }
`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemMsg },
          { role: 'user', content: prompt }
        ]
      });

      const rawContent = response.choices[0].message.content;
      console.log('[askMealAI] GPT raw content:', rawContent);

      let filters;
      try {
        filters = JSON.parse(rawContent);
      } catch (parseError) {
        console.error('❌ GPT returned invalid JSON:', rawContent);
        return res.status(500).json({ error: 'GPT returned invalid response' });
      }

      return res.status(200).json(filters);
    } catch (err) {
      console.error('askMealAI error:', err);
      return res.status(500).send(`GPT error: ${err.message}`);
    }
  });
});
