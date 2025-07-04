const admin = require("firebase-admin");

admin.initializeApp({
  credential: admin.credential.applicationDefault(), // or use service account
  databaseURL: "https://your-project-id.firebaseio.com",
});

// DELETE both Firestore document and Auth user
async function deleteUserAndData(uid) {
  try {
    // Delete Firestore data
    await admin.firestore().collection('users').doc(uid).delete();

    // Delete Firebase Auth account
    await admin.auth().deleteUser(uid);

    console.log(`Successfully deleted user and data for UID: ${uid}`);
    return { success: true };
  } catch (error) {
    console.error("Error deleting user:", error);
    return { success: false, error: error.message };
  }
}
