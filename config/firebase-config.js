// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth"; // 👈 Add this
import { getFirestore, doc, setDoc } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBvc4-Eu2XbzAfvUR-ly4oEVxqcxTNbr9M",
  authDomain: "my-calorie-fyp.firebaseapp.com",
  projectId: "my-calorie-fyp",
  storageBucket: "my-calorie-fyp.firebasestorage.app",
  messagingSenderId: "952183755976",
  appId: "1:952183755976:web:9ce913600aa79cf71501fd",
  measurementId: "G-NPDB29MLL1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app); // ✅ Initialize auth
const db = getFirestore(app);


/*// Optional: Only initialize analytics if supported (to silence warnings)
isSupported().then((supported) => {
  if (supported) {
    getAnalytics(app);
  }
});*/

export { auth, db};
