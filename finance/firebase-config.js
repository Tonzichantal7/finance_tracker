// Firebase Configuration
// Replace these values with your Firebase project configuration
const firebaseConfig = {
    apiKey: "AIzaSyAeya3dTY2fjxW5_4SAGAcNThDfc22Wx7o",
    authDomain: "finance-tracker-project-fdae8.firebaseapp.com",
    projectId: "finance-tracker-project-fdae8",
    storageBucket: "finance-tracker-project-fdae8.appspot.com",
    messagingSenderId: "667825321136",
    appId: "1:667825321136:web:7b76e51455f25cc5043775"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = firebase.auth();
const db = firebase.firestore();

// Google Auth Provider
const googleProvider = new firebase.auth.GoogleAuthProvider();

