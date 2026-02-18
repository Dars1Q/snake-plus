// api.js - API Client for Snake+ Backend
import { API_URL } from './config.js';

const API_BASE_URL = API_URL || 'http://localhost:3000/api';

// Get Telegram user ID
function getUserId() {
  if (window.Telegram && window.Telegram.WebApp) {
    const user = window.Telegram.WebApp.initDataUnsafe?.user;
    if (user) {
      return String(user.id);
    }
  }
  // Fallback to localStorage
  let id = localStorage.getItem('snakeplus_userId');
  if (!id) {
    id = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
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
  
  return apiRequest('/score', {
    method: 'POST',
    body: JSON.stringify({
      userId,
      username,
      score,
      rank,
      language,
      telegramUser,
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

// Update user stars
export async function updateStars(stars, totalStars) {
  return apiRequest(`/user/${getUserId()}/stars`, {
    method: 'POST',
    body: JSON.stringify({
      stars,
      totalStars,
    }),
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
