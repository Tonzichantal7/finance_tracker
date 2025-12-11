// Import Firebase functions
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore, collection, addDoc, doc, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAeya3dTY2fjxW5_4SAGAcNThDfc22Wx7o",
    authDomain: "finance-tracker-project-fdae8.firebaseapp.com",
    projectId: "finance-tracker-project-fdae8",
    storageBucket: "finance-tracker-project-fdae8.firebasestorage.app",
    messagingSenderId: "667825321136",
    appId: "1:667825321136:web:7b76e51455f25cc5043775"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Make available globally
window.auth = auth;
window.db = db;
window.signInWithEmailAndPassword = signInWithEmailAndPassword;
window.createUserWithEmailAndPassword = createUserWithEmailAndPassword;
window.signOut = signOut;
window.onAuthStateChanged = onAuthStateChanged;
window.updateProfile = updateProfile;
window.setDoc = setDoc;
window.doc = doc;
window.serverTimestamp = serverTimestamp;

