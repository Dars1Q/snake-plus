// api.js - API Client for Snake+ (Firebase via global window.firebase)

// Get Telegram user ID
function getUserId() {
  if (window.Telegram && window.Telegram.WebApp) {
    const user = window.Telegram.WebApp.initDataUnsafe?.user;
    if (user && user.id) {
      return String(user.id);
    }
  }
  return localStorage.getItem('snakeplus_userId') || 'anonymous';
}

// Get username
function getUsername() {
  if (window.Telegram && window.Telegram.WebApp) {
    const user = window.Telegram.WebApp.initDataUnsafe?.user;
    if (user) {
      return user.username || user.first_name || 'Anonymous';
    }
  }
  return 'Anonymous';
}

// ============================================
// FIREBASE FUNCTIONS (using global firebase)
// ============================================

// Save score to Firebase
export async function saveScore(score, rank, telegramUser = null) {
  if (!window.db) {
    console.error('Firebase not initialized');
    return { success: false, error: 'Firebase not initialized' };
  }

  try {
    const userId = telegramUser?.id || getUserId();
    const username = telegramUser?.username || telegramUser?.first_name || getUsername();

    await window.db.collection('scores').add({
      userId: String(userId),
      username: username || 'Anonymous',
      score: score,
      rank: rank,
      telegram_user: telegramUser ? JSON.stringify(telegramUser) : null,
      createdAt: window.firebase.firestore.FieldValue.serverTimestamp(),
      language: localStorage.getItem('snakeplus_language') || 'en'
    });

    console.log('✅ Score saved to Firebase:', score);
    return { success: true };
  } catch (error) {
    console.error('❌ Error saving score:', error);
    return { success: false, error: error.message };
  }
}

// Get leaderboard from Firebase
export async function getLeaderboard(limitCount = 50) {
  if (!window.db) {
    console.error('Firebase not initialized');
    return { success: false, error: 'Firebase not initialized' };
  }

  try {
    const querySnapshot = await window.db.collection('scores')
      .orderBy('score', 'desc')
      .limit(limitCount)
      .get();

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

// Check if Firebase is available
export async function isServerAvailable() {
  return window.db !== null;
}

// Buy skin (local only - no server needed)
export async function buySkin(skinColor, skinName, price) {
  // This is handled locally in mechanics.js
  return { success: true, message: 'Skin purchased locally' };
}

// Get user's skins (local only)
export async function getUserSkins() {
  const skins = JSON.parse(localStorage.getItem('snakeplus_skins') || '["#2ecc40"]');
  return { success: true, skins: skins.map(color => ({ skin_color: color })) };
}

// Get user data (local only)
export async function getUserData() {
  const stars = localStorage.getItem('snakeplus_stars') || '0';
  const skins = JSON.parse(localStorage.getItem('snakeplus_skins') || '["#2ecc40"]');
  const scores = JSON.parse(localStorage.getItem('snakeplus_scores') || '[]');
  return {
    success: true,
    user: {
      userId: getUserId(),
      stars: parseInt(stars),
      skins: skins,
      bestScore: scores.length > 0 ? scores[0] : 0
    }
  };
}

export { getUserId, getUsername };
