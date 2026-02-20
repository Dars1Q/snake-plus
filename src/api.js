// api.js - API Client for Snake+ Backend
import { API_URL } from './config.js';

const API_BASE_URL = API_URL || 'http://localhost:3000/api';

// Get Telegram user ID - ALWAYS use Telegram ID when available
function getUserId() {
  // Priority 1: Telegram User ID (most reliable)
  if (window.Telegram && window.Telegram.WebApp) {
    const user = window.Telegram.WebApp.initDataUnsafe?.user;
    if (user && user.id) {
      const tgId = String(user.id);
      // Save to localStorage for consistency
      localStorage.setItem('snakeplus_userId', tgId);
      return tgId;
    }
  }
  
  // Priority 2: Check if we have Telegram user data in localStorage
  try {
    const tgUser = JSON.parse(localStorage.getItem('snakeplus_telegram_user') || '{}');
    if (tgUser && tgUser.id) {
      return String(tgUser.id);
    }
  } catch(e) {}
  
  // Priority 3: Use stored userId from localStorage
  let id = localStorage.getItem('snakeplus_userId');
  if (!id) {
    // Fallback: generate anonymous ID (this will be different per device)
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

// API request helper
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'API request failed');
    }
    
    return data;
  } catch (error) {
    console.error(`API error (${endpoint}):`, error);
    throw error;
  }
}

// Save score
export async function saveScore(score, rank, telegramUser = null) {
  const userId = getUserId();
  const username = getUsername();
  const language = localStorage.getItem('snakeplus_language') || 'en';

  // Get fresh Telegram user data
  let tgUser = telegramUser;
  if (!tgUser && window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe) {
    tgUser = window.Telegram.WebApp.initDataUnsafe.user;
  }

  console.log('Saving score:', { userId, username, score, rank, hasTgUser: !!tgUser });

  return apiRequest('/score', {
    method: 'POST',
    body: JSON.stringify({
      userId,
      username,
      score,
      rank,
      language,
      telegramUser: tgUser,
    }),
  });
}

// Save player stats to server for cross-device sync
export async function savePlayerStatsToServer(stats) {
  const userId = getUserId();
  const username = getUsername();
  
  console.log('Saving player stats:', { userId, username, stats });
  
  return apiRequest('/user/' + userId + '/stats', {
    method: 'POST',
    body: JSON.stringify({
      userId,
      username,
      stats: {
        bestScore: stats.bestScore,
        maxCombo: stats.maxCombo,
        totalGames: stats.totalGames,
        boostersUsed: stats.boostersUsed,
        skinsOwned: stats.skinsOwned,
        totalStars: stats.totalStars,
      },
    }),
  });
}

// Get leaderboard
export async function getLeaderboard(limit = 50) {
  return apiRequest(`/leaderboard?limit=${limit}`);
}

// Get user's best score
export async function getUserBestScore() {
  return apiRequest(`/user/${getUserId()}/best`);
}

// Get user's scores history
export async function getUserScores(limit = 10) {
  return apiRequest(`/user/${getUserId()}/scores?limit=${limit}`);
}

// Buy skin
export async function buySkin(skinColor, skinName, price) {
  return apiRequest('/skin/buy', {
    method: 'POST',
    body: JSON.stringify({
      userId: getUserId(),
      skinColor,
      skinName,
      price,
    }),
  });
}

// Get user's skins
export async function getUserSkins() {
  return apiRequest(`/user/${getUserId()}/skins`);
}

// Update user stars - with debounce to prevent spam
let starsUpdateTimeout = null;
let pendingStars = null;

export async function updateStars(stars, totalStars) {
  // Store pending update
  pendingStars = { stars, totalStars };
  
  // Clear existing timeout
  if (starsUpdateTimeout) {
    clearTimeout(starsUpdateTimeout);
  }
  
  // Debounce - wait 2 seconds before sending
  return new Promise((resolve) => {
    starsUpdateTimeout = setTimeout(async () => {
      if (!pendingStars) {
        resolve({ success: false, message: 'Cancelled' });
        return;
      }
      
      try {
        const result = await apiRequest(`/user/${getUserId()}/stars`, {
          method: 'POST',
          body: JSON.stringify({
            stars: pendingStars.stars,
            totalStars: pendingStars.totalStars,
          }),
        });
        pendingStars = null;
        resolve(result);
      } catch (error) {
        console.error('Failed to update stars (debounced):', error);
        pendingStars = null;
        resolve({ success: false, error: error.message });
      }
    }, 2000);
  });
}

// Get full user data
export async function getUserData() {
  return apiRequest(`/user/${getUserId()}`);
}

// Get global rank for a score
export async function getGlobalRank(score) {
  return apiRequest(`/rank/${score}`);
}

// Health check
export async function checkHealth() {
  try {
    return await apiRequest('/health');
  } catch {
    return null;
  }
}

// Check if server is available
export async function isServerAvailable() {
  const health = await checkHealth();
  return health !== null;
}

// Export for use in other modules
export { getUserId, getUsername };
