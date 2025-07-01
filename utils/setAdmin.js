// setAdmin.js
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // Download this from Firebase Console

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const uid = 'vfuLYstIQdVUZWdikvvcdpu2l9X2'; // <-- paste the UID of the admin account

admin.auth().setCustomUserClaims(uid, { isAdmin: true })
  .then(() => {
    console.log(`✅ isAdmin set to true for UID: ${uid}`);
  })
  .catch((error) => {
    console.error('❌ Error setting admin claim:', error);
  });
