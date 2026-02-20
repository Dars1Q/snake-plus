// firebase.js - Firebase Configuration and Functions
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  limit,
  serverTimestamp 
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

// ============================================
// FIREBASE CONFIGURATION
// ============================================
const firebaseConfig = {
  apiKey: "AIzaSyCz1y6iiSlg83iaJtQ2WOJ-XA5dAcM6bq8",
  authDomain: "snakeplus-df162.firebaseapp.com",
  projectId: "snakeplus-df162",
  storageBucket: "snakeplus-df162.firebasestorage.app",
  messagingSenderId: "267857364718",
  appId: "1:267857364718:web:1834d21c04bdb1a6da55ff"
};

// Initialize Firebase
let app = null;
let db = null;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  console.log('✅ Firebase initialized successfully');
} catch (error) {
  console.error('❌ Firebase initialization error:', error);
}

// ============================================
// SAVE SCORE TO FIREBASE
// ============================================
export async function saveScoreToFirebase(score, rank, telegramUser = null) {
  if (!db) {
    console.error('Firebase not initialized');
    return { success: false, error: 'Firebase not initialized' };
  }

  try {
    const userId = telegramUser?.id || localStorage.getItem('snakeplus_userId') || 'anonymous';
    const username = telegramUser?.username || telegramUser?.first_name || localStorage.getItem('snakeplus_username') || 'Anonymous';

    await addDoc(collection(db, 'scores'), {
      userId: String(userId),
      username: username || 'Anonymous',
      score: score,
      rank: rank,
      telegram_user: telegramUser ? JSON.stringify(telegramUser) : null,
      createdAt: serverTimestamp(),
      language: localStorage.getItem('snakeplus_language') || 'en'
    });

    console.log('✅ Score saved to Firebase:', score);
    return { success: true };
  } catch (error) {
    console.error('❌ Error saving score:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// GET LEADERBOARD FROM FIREBASE
// ============================================
export async function getLeaderboardFromFirebase(limitCount = 50) {
  if (!db) {
    console.error('Firebase not initialized');
    return { success: false, error: 'Firebase not initialized' };
  }

  try {
    const q = query(
      collection(db, 'scores'),
      orderBy('score', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const leaderboard = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      leaderboard.push({
        id: doc.id,
        userId: data.userId,
        username: data.username,
        score: data.score,
        rank: data.rank,
        telegram_user: data.telegram_user,
        language: data.language,
        createdAt: data.createdAt
      });
    });

    console.log('✅ Leaderboard loaded:', leaderboard.length, 'players');
    return { success: true, leaderboard };
  } catch (error) {
    console.error('❌ Error loading leaderboard:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// CHECK FIREBASE CONNECTION
// ============================================
export async function isFirebaseAvailable() {
  return db !== null;
}

export { db, app };
