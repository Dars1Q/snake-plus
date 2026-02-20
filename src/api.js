// api.js - API Client for Snake+ Backend (Firebase + Local)
import { saveScoreToFirebase, getLeaderboardFromFirebase, isFirebaseAvailable } from './firebase.js';

// Get Telegram user ID - ALWAYS use Telegram ID when available
function getUserId() {
  // Priority 1: Telegram User ID (most reliable)
  if (window.Telegram && window.Telegram.WebApp) {
    const user = window.Telegram.WebApp.initDataUnsafe?.user;
    if (user && user.id) {
      const tgId = String(user.id);
      localStorage.setItem('snakeplus_userId', tgId);
      return tgId;
    }
  }
  
  // Priority 2: Check Telegram user data in localStorage
  try {
    const tgUser = JSON.parse(localStorage.getItem('snakeplus_telegram_user') || '{}');
    if (tgUser && tgUser.id) {
      return String(tgUser.id);
    }
  } catch(e) {}
  
  // Priority 3: Use stored userId
  let id = localStorage.getItem('snakeplus_userId');
  if (!id) {
    id = 'anon_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('snakeplus_userId', id);
  }
  return id;
}

// Get username
function getUsername() {
  if (window.Telegram && window.Telegram.WebApp) {
    const user = window.Telegram.WebApp.initDataUnsafe?.user;
    if (user) {
      return user.username || user.first_name || 'Anonymous';
    }
  }
  return localStorage.getItem('snakeplus_username') || 'Anonymous';
}

// ============================================
// FIREBASE FUNCTIONS (replaces REST API)
// ============================================

// Save score to Firebase
export async function saveScore(score, rank, telegramUser = null) {
  return await saveScoreToFirebase(score, rank, telegramUser);
}

// Get leaderboard from Firebase
export async function getLeaderboard(limitCount = 50) {
  return await getLeaderboardFromFirebase(limitCount);
}

// Check if Firebase is available
export async function isServerAvailable() {
  return await isFirebaseAvailable();
}

export { getUserId, getUsername };
