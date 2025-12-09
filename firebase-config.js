// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDGE8vL5vYxZ9QZ8xZ9QZ8xZ9QZ8xZ9QZ8",
    authDomain: "my-movies-833c3.firebaseapp.com",
    projectId: "my-movies-833c3",
    storageBucket: "my-movies-833c3.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef1234567890"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Generate or retrieve user ID
let userId = localStorage.getItem('budgetUserId');
if (!userId) {
    userId = 'budget_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('budgetUserId', userId);
}
