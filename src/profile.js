// profile.js - Player Profile UI
import { getRank, getPlayerStats } from './mechanics.js';
import { getUserData, getUserScores } from './api.js';
import { ONLINE_MODE } from './config.js';

const translations = {
  en: {
    profile: 'Profile',
    stats: 'Statistics',
    gamesPlayed: 'Games Played',
    bestScore: 'Best Score',
    totalStars: 'Total Stars',
    currentRank: 'Current Rank',
    winRate: 'Win Rate',
    averageScore: 'Average Score',
    recentGames: 'Recent Games',
    noData: 'No data yet',
    loading: 'Loading...',
  },
  ru: {
    profile: 'Профиль',
    stats: 'Статистика',
    gamesPlayed: 'Игр сыграно',
    bestScore: 'Лучший счёт',
    totalStars: 'Всего звёзд',
    currentRank: 'Текущий ранг',
    winRate: 'Процент побед',
    averageScore: 'Средний счёт',
    recentGames: 'Последние игры',
    noData: 'Нет данных',
    loading: 'Загрузка...',
  },
};

let currentLang = localStorage.getItem('snakeplus_language') || 'en';

export function showProfile() {
  const ui = document.getElementById('ui');
  const lang = translations[currentLang];
  
  ui.innerHTML = `
    <h2>👤 ${lang.profile}</h2>
    <div id="profile-content" style="width:100%; max-width:380px;">
      <div style="text-align:center; padding:40px; color:#666;">
        <div style="font-size:3rem; margin-bottom:20px;">⏳</div>
        <div>${lang.loading}</div>
      </div>
    </div>
    <div style="display:flex; flex-direction:column; gap:10px; width:100%; max-width:380px; margin-top:16px;">
      <button id="back-btn" style="width:100%;">🏠 ${lang.profile === 'Profile' ? 'Menu' : 'Меню'}</button>
    </div>
  `;
  
  // Load profile data
  loadProfileData(lang);
  
  document.getElementById('back-btn').onclick = () => {
    // Will be set by gameEngine
    if (window.showMainMenu) {
      window.showMainMenu();
    }
  };
}

async function loadProfileData(lang) {
  const content = document.getElementById('profile-content');

  try {
    // Get stats from localStorage (updated after each game)
    const stats = getPlayerStats();
    const localStars = localStorage.getItem('snakeplus_stars') || '0';
    const localSkins = JSON.parse(localStorage.getItem('snakeplus_skins') || '["#2ecc40"]');
    const localScores = JSON.parse(localStorage.getItem('snakeplus_scores') || '[]');

    const userData = {
      bestScore: stats.bestScore || (localScores.length > 0 ? localScores[0] : 0),
      stars: parseInt(localStars),
      totalStars: stats.totalStars || parseInt(localStars),
      rank: getRank(stats.bestScore || 0).name,
    };

    const rank = getRank(userData.bestScore || 0);
    const gamesPlayed = stats.totalGames || 0;
    const avgScore = gamesPlayed > 0 && stats.totalScore ? Math.round(stats.totalScore / gamesPlayed) : 0;

    content.innerHTML = `
      <!-- Profile Header -->
      <div style="background:linear-gradient(135deg, #1f2326 0%, #23272b 100%); border:1px solid #2ecc40; border-radius:12px; padding:20px; margin-bottom:16px; text-align:center;">
        <div style="width:80px; height:80px; margin:0 auto 12px; border-radius:50%; background:linear-gradient(135deg, #2ecc40 0%, #27ae38 100%); display:flex; align-items:center; justify-content:center; font-size:2.5rem; box-shadow:0 4px 20px rgba(46,204,64,0.4);">🐍</div>
        <div style="font-size:1.3rem; font-weight:bold; color:#fff; margin-bottom:4px;">${getTelegramUsername()}</div>
        <div style="color:${rank.color}; font-size:1rem; text-shadow:0 0 10px ${rank.color}80;">🏅 ${rank.name}</div>
      </div>

      <!-- Stats Grid -->
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:16px;">
        <div style="background:#141618; border:1px solid #2ecc40; border-radius:10px; padding:16px; text-align:center;">
          <div style="font-size:0.8rem; color:#6ab878; margin-bottom:8px;">🎮 ${lang.gamesPlayed}</div>
          <div style="font-size:1.8rem; font-weight:bold; color:#fff;">${gamesPlayed}</div>
        </div>
        <div style="background:#141618; border:1px solid #2ecc40; border-radius:10px; padding:16px; text-align:center;">
          <div style="font-size:0.8rem; color:#6ab878; margin-bottom:8px;">⭐ ${lang.totalStars}</div>
          <div style="font-size:1.8rem; font-weight:bold; color:#ffe066;">${userData.totalStars || userData.stars || 0}</div>
        </div>
        <div style="background:#141618; border:1px solid #2ecc40; border-radius:10px; padding:16px; text-align:center;">
          <div style="font-size:0.8rem; color:#6ab878; margin-bottom:8px;">🏆 ${lang.bestScore}</div>
          <div style="font-size:1.8rem; font-weight:bold; color:#2ecc40;">${userData.bestScore || 0}</div>
        </div>
        <div style="background:#141618; border:1px solid #2ecc40; border-radius:10px; padding:16px; text-align:center;">
          <div style="font-size:0.8rem; color:#6ab878; margin-bottom:8px;">🎨 ${lang.skinsOwned || 'Skins'}</div>
          <div style="font-size:1.8rem; font-weight:bold; color:#3498db;">${localSkins.length}</div>
        </div>
      </div>

      <!-- Top 5 Personal Games -->
      <div style="background:#141618; border:1px solid #2ecc40; border-radius:12px; padding:16px;">
        <h3 style="margin:0 0 12px 0; color:#2ecc40; font-size:1.1rem;">🎯 Top 5 Personal</h3>
        ${localScores.length > 0
          ? localScores.slice(0, 5).map((s, i) => {
              const gameRank = getRank(s);
              return `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:${i < Math.min(localScores.length, 5) - 1 ? '1px solid #2a2d31' : 'none'};">
                  <div style="display:flex; align-items:center; gap:10px;">
                    <span style="color:#ffe066; font-weight:bold; font-size:1rem; width:25px;">${i === 0 ? '🥇' : (i === 1 ? '🥈' : (i === 2 ? '🥉' : '#' + (i+1)))}</span>
                    <span style="color:${gameRank.color}; font-size:0.8rem;">${gameRank.name}</span>
                  </div>
                  <span style="color:#2ecc40; font-weight:bold; font-size:1.1rem;">${s}</span>
                </div>
              `;
            }).join('')
          : `<div style="text-align:center; color:#666; padding:20px;">${lang.noData}</div>`
        }
      </div>
    `;
  } catch (err) {
    console.error('Profile load error:', err);
    content.innerHTML = `
      <div style="text-align:center; padding:40px; color:#666;">
        <div style="font-size:3rem; margin-bottom:20px;">❌</div>
        <div>${lang.noData}</div>
      </div>
    `;
  }
}

function getTelegramUsername() {
  try {
    const user = JSON.parse(localStorage.getItem('snakeplus_telegram_user') || '{}');
    return user.username || 'Player';
  } catch {
    return 'Player';
  }
}

export function setLanguage(lang) {
  currentLang = lang;
}
