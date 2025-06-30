const fs = require('fs');
const admin = require('firebase-admin');

// Load Firebase Admin SDK
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const meals = JSON.parse(fs.readFileSync('./malaysianFoods.json', 'utf8'));

async function uploadMeals() {
  const ref = db.collection('malaysianFoods');
  let addedCount = 0;

  for (const meal of meals) {
    const snapshot = await ref.where('name', '==', meal.name).get();

    if (snapshot.empty) {
      const docRef = ref.doc(); // auto ID
      await docRef.set(meal);
      console.log(`✅ Added: ${meal.name}`);
      addedCount++;
    } else {
      console.log(`⚠️ Skipped (already exists): ${meal.name}`);
    }
  }

  console.log(`🎉 Finished. ${addedCount} new meals uploaded.`);
}

uploadMeals().catch(console.error);
