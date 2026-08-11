// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyD671RI0XeqEeQkuWdIOFpusobjogR5jow",
    authDomain: "uniguide7878.firebaseapp.com",
    projectId: "uniguide7878",
    storageBucket: "uniguide7878.firebasestorage.app",
    messagingSenderId: "772007794127",
    appId: "1:772007794127:web:7eb7e16813122d4c03aeba",
    measurementId: "G-8G3BLZH1RC"
};

// Initialize Firebase
let auth = null;
let db = null;

try {
    firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    db = firebase.firestore();
    db.enablePersistence({ synchronizeTabs: true }).catch(() => {});
} catch (e) {
    console.error('Firebase init error:', e);
}
