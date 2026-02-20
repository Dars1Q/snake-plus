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
    // Get all scores
    const querySnapshot = await window.db.collection('scores')
      .orderBy('score', 'desc')
      .get();

    // Group by userId and keep only best score per user
    const bestScores = new Map();
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const userId = data.userId;
      
      // Keep only the best score for each user
      if (!bestScores.has(userId) || data.score > bestScores.get(userId).score) {
        bestScores.set(userId, {
          id: doc.id,
          userId: userId,
          username: data.username,
          score: data.score,
          rank: data.rank,
          telegram_user: data.telegram_user,
          language: data.language,
          createdAt: data.createdAt
        });
      }
    });

    // Convert to array and sort by score
    const leaderboard = Array.from(bestScores.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limitCount);

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

// Get user scores (local only)
export async function getUserScores(limit = 10) {
  const scores = JSON.parse(localStorage.getItem('snakeplus_scores') || '[]');
  return { success: true, scores: scores.slice(0, limit) };
}

// Get user best score (local only)
export async function getUserBestScore() {
  const scores = JSON.parse(localStorage.getItem('snakeplus_scores') || '[]');
  return { 
    success: true, 
    bestScore: scores.length > 0 ? { best_score: scores[0] } : null 
  };
}

// Update user stars (local only)
export async function updateStars(stars, totalStars) {
  localStorage.setItem('snakeplus_stars', String(stars));
  return { success: true };
}

// Save player stats to Firebase (for cross-device sync)
export async function savePlayerStatsFirebase(stats) {
  if (!window.db) {
    console.log('Firebase not ready, saving locally only');
    return { success: false, error: 'Firebase not ready' };
  }

  try {
    const userId = getUserId();
    const username = getUsername();

    // Save to Firebase
    await window.db.collection('playerStats').doc(userId).set({
      userId: userId,
      username: username,
      bestScore: stats.bestScore || 0,
      maxCombo: stats.maxCombo || 0,
      totalGames: stats.totalGames || 0,
      totalScore: stats.totalScore || 0,
      boostersUsed: stats.boostersUsed || [],
      skinsOwned: stats.skinsOwned || 0,
      totalStars: stats.totalStars || 0,
      achievements: stats.achievements || [],
      unlockedSkins: stats.unlockedSkins || [],
      lastPlayed: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    console.log('✅ Player stats saved to Firebase');
    return { success: true };
  } catch (error) {
    console.error('❌ Error saving player stats:', error);
    return { success: false, error: error.message };
  }
}

// Get player stats from Firebase
export async function getPlayerStatsFirebase() {
  if (!window.db) {
    return null;
  }

  try {
    const userId = getUserId();
    const doc = await window.db.collection('playerStats').doc(userId).get();

    if (doc.exists) {
      const data = doc.data();
      console.log('✅ Player stats loaded from Firebase');
      return {
        bestScore: data.bestScore || 0,
        maxCombo: data.maxCombo || 0,
        totalGames: data.totalGames || 0,
        totalScore: data.totalScore || 0,
        boostersUsed: data.boostersUsed || [],
        skinsOwned: data.skinsOwned || 0,
        totalStars: data.totalStars || 0,
        achievements: data.achievements || [],
        unlockedSkins: data.unlockedSkins || []
      };
    }
    return null;
  } catch (error) {
    console.error('❌ Error loading player stats:', error);
    return null;
  }
}

export { getUserId, getUsername };
