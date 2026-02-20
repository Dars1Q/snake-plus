// ui.js
// Handles UI overlays, score, restart, leaderboard, skins, shop
import { SKINS_CATALOG, buySkinFromCatalog, getRank } from './mechanics.js';
import { getLeaderboard, getUserSkins, buySkin, getUserData, isServerAvailable } from './api.js';
import { ONLINE_MODE } from './config.js';
import { soundManager } from './audio.js';

let gameState = null;
function setGameStateUI(state) { gameState = state; }
function getGameState() { return gameState; }

function updateUI(state) {
  setGameStateUI(state);
  let scoreEl = document.getElementById('score-display');
  let starsEl = document.getElementById('stars-display');
  let comboEl = document.getElementById('combo-display');
  let boosterEl = document.getElementById('booster-display');

  if (!scoreEl || !starsEl) {
    const ui = document.getElementById('ui');
    const hud = document.createElement('div');
    hud.id = 'hud';
    hud.style.cssText = 'width:auto; max-width:380px; padding:12px 16px; background:#0a0a0a; border:1px solid #2ecc40; border-radius:6px; display:flex; justify-content:space-around; align-items:center; font-size:1rem; margin-bottom:12px; gap:20px;';

    scoreEl = document.createElement('div');
    scoreEl.id = 'score-display';
    scoreEl.style.cssText = 'text-align:center; flex:1;';

    starsEl = document.createElement('div');
    starsEl.id = 'stars-display';
    starsEl.style.cssText = 'text-align:center; flex:1;';

    hud.appendChild(scoreEl);
    hud.appendChild(starsEl);
    ui.insertBefore(hud, ui.firstChild);
  }

  // Create/update booster display
  if (state.booster) {
    if (!boosterEl) {
      boosterEl = document.createElement('div');
      boosterEl.id = 'booster-display';
      boosterEl.style.cssText = 'text-align:center; flex:1; background:rgba(255,255,255,0.1); border-radius:8px; padding:8px;';
      document.getElementById('hud').appendChild(boosterEl);
    }
  } else if (boosterEl) {
    boosterEl.remove();
    boosterEl = null;
  }

  // Combo display (appears only when multiplier > 1)
  if (!comboEl && state.comboMultiplier > 1) {
    comboEl = document.createElement('div');
    comboEl.id = 'combo-display';
    comboEl.style.cssText = 'text-align:center; flex:1;';
    document.getElementById('hud').appendChild(comboEl);
  } else if (comboEl && state.comboMultiplier <= 1) {
    comboEl.remove();
    comboEl = null;
  }

  scoreEl.innerHTML = '<b>📊 Score</b><br><span style="color:#2ecc40; font-size:1.2rem;">' + (state.score || 0) + '</span>';
  starsEl.innerHTML = '<b>⭐ Stars</b><br><span style="color:#2ecc40; font-size:1.2rem;">' + Math.floor(state.stars || 0) + '</span>';
  
  if (boosterEl && state.booster) {
    const remaining = Math.max(0, (state.booster.endTime - performance.now()) / 1000).toFixed(1);
    boosterEl.innerHTML = '<b style="color:' + state.booster.color + ';">' + state.booster.icon + ' ' + state.booster.name + '</b><br><span style="color:#fff; font-size:1rem;">' + remaining + 's</span>';
  }
  
  if (comboEl) {
    comboEl.innerHTML = '<b>🔥 Combo</b><br><span style="color:#ffe066; font-size:1.2rem;">x' + state.comboMultiplier + '</span>';
  }
}

const translations = {
  en: {
    start: 'Start',
    shop: 'Shop',
    rating: 'Rating',
    settings: 'Settings',
    selectSkin: 'Select Skin',
    shopTitle: 'Shop',
    stars: 'Stars',
    gameOver: 'Game Over',
    score: 'Score',
    place: 'Place',
    yourSkins: 'Your Skins',
    playAgain: 'Play Again',
    menu: 'Menu',
    share: 'Share Result',
    profile: 'Profile',
    achievements: 'Achievements',
    leaderboard: 'Leaderboard (TOP 5)',
    skins: {
      Classic: 'Classic',
      Orange: 'Orange',
      Purple: 'Purple',
      Blue: 'Blue',
      Gold: 'Gold',
      Pink: 'Pink',
      Turquoise: 'Turquoise',
      Red: 'Red',
      Teal: 'Teal',
      Midnight: 'Midnight',
      Crimson: 'Crimson',
      Wisteria: 'Wisteria',
      Emerald: 'Emerald',
      Pumpkin: 'Pumpkin',
      Silver: 'Silver',
      Cyan: 'Cyan',
      Magenta: 'Magenta',
      Indigo: 'Indigo',
    },
  },
  ru: {
    start: 'Играть',
    shop: 'Магазин',
    rating: 'Рейтинг',
    settings: 'Настройки',
    selectSkin: 'Выбрать скин',
    shopTitle: 'Магазин',
    stars: 'Звёзды',
    gameOver: 'Конец игры',
    score: 'Очки',
    place: 'Место',
    yourSkins: 'Ваши скины',
    playAgain: 'Играть заново',
    menu: 'Меню',
    share: 'Поделиться',
    profile: 'Профиль',
    achievements: 'Достижения',
    leaderboard: 'Рейтинг (ТОП 5)',
    skins: {
      Classic: 'Классический',
      Orange: 'Апельсин',
      Purple: 'Фиолетовый',
      Blue: 'Синий',
      Gold: 'Золотой',
      Pink: 'Розовый',
      Turquoise: 'Бирюзовый',
      Red: 'Красный',
      Teal: 'Бирюза',
      Midnight: 'Полночь',
      Crimson: 'Малиновый',
      Wisteria: 'Глициния',
      Emerald: 'Изумруд',
      Pumpkin: 'Тыква',
      Silver: 'Серебро',
      Cyan: 'Циан',
      Magenta: 'Маджента',
      Indigo: 'Индиго',
    },
  },
};

let currentLanguage = localStorage.getItem('snakeplus_language') || 'en';
let currentTheme = localStorage.getItem('snakeplus_theme') || 'dark';

// Theme functions
function setTheme(theme) {
  currentTheme = theme;
  localStorage.setItem('snakeplus_theme', theme);
  document.documentElement.setAttribute('data-theme', theme);
  
  // Update button styles
  const darkBtn = document.getElementById('theme-dark-btn');
  const lightBtn = document.getElementById('theme-light-btn');
  
  if (darkBtn && lightBtn) {
    if (theme === 'dark') {
      darkBtn.style.borderColor = '#2ecc40';
      darkBtn.style.boxShadow = '0 0 10px rgba(46, 204, 64, 0.5)';
      lightBtn.style.borderColor = '#ccc';
      lightBtn.style.boxShadow = 'none';
    } else {
      lightBtn.style.borderColor = '#2ecc40';
      lightBtn.style.boxShadow = '0 0 10px rgba(46, 204, 64, 0.5)';
      darkBtn.style.borderColor = '#666';
      darkBtn.style.boxShadow = 'none';
    }
  }
}

function loadTheme() {
  const savedTheme = localStorage.getItem('snakeplus_theme') || 'dark';
  setTheme(savedTheme);
}

function setLanguage(lang) {
  currentLanguage = lang;
  localStorage.setItem('snakeplus_language', lang);
  updateLanguageUI();
}

function getTranslation(key) {
  const lang = translations[currentLanguage];
  return lang && lang[key] ? lang[key] : key;
}

function updateLanguageUI() {
  const startBtn = document.getElementById('start-btn');
  if (startBtn) startBtn.textContent = '🎮 ' + getTranslation('start');

  const shopBtn = document.getElementById('shop-btn');
  if (shopBtn) shopBtn.textContent = '🛒 ' + getTranslation('shop');

  const ratingBtn = document.getElementById('rating-btn');
  if (ratingBtn) ratingBtn.textContent = '🏆 ' + getTranslation('rating');

  const settingsBtn = document.getElementById('settings-btn');
  if (settingsBtn) settingsBtn.textContent = '⚙️ ' + getTranslation('settings');

  const settingsTitle = document.querySelector('#settings-panel h3');
  if (settingsTitle) settingsTitle.textContent = '🎨 ' + getTranslation('selectSkin');

  const shopTitle = document.querySelector('#shop-panel h3');
  if (shopTitle) shopTitle.textContent = '🛒 ' + getTranslation('shopTitle');

  const shopStarsDisplay = document.getElementById('shop-stars-display');
  if (shopStarsDisplay) shopStarsDisplay.textContent = getTranslation('stars') + ':';

  renderShop();
}

function showStartScreen(show, startCallback) {
  const ui = document.getElementById('ui');
  if (show) {
    const lang = translations[currentLanguage];
    ui.innerHTML = `
      <h2> 🐍 Snake+</h2>
      <div style="display: flex; flex-direction: column; gap: 10px; width: 100%; margin: 16px 0; max-width: 380px;">
        <button id="start-btn" style="width: 100%;">🎮 ${lang.start}</button>
        <button id="achievements-btn" style="width: 100%;">🏆 ${lang.achievements || 'Achievements'}</button>
        <button id="profile-btn" style="width: 100%;">👤 ${lang.profile || 'Profile'}</button>
        <button id="shop-btn" style="width: 100%;">🛒 ${lang.shop}</button>
        <button id="rating-btn" style="width: 100%;">🏆 ${lang.rating}</button>
        <button id="settings-btn" style="width: 100%;">⚙️ ${lang.settings}</button>
      </div>
      <div id="leaderboard" style="display:none;"></div>
      <div id="settings-panel" style="display:none;">
        <h3 style="text-align:center; margin-top:0;">🎨 ${lang.selectSkin}</h3>
        <div id="skins-list" style="display:flex; gap:10px; justify-content:center; flex-wrap:wrap; margin: 12px 0;"></div>
        <div style="margin-top:20px; border-top:1px solid #2ecc40; padding-top:16px;">
          <h4 style="color:#2ecc40; margin:0 0 12px 0; font-size:1rem;">🔊 Sound Settings</h4>
          <div style="margin-bottom:12px;">
            <label for="sfx-volume" style="display:block; margin-bottom:6px; color:#aaa;">SFX Volume:</label>
            <input type="range" id="sfx-volume" min="0" max="100" value="30" style="width:100%;"/>
          </div>
          <h4 style="color:#2ecc40; margin:16px 0 12px 0; font-size:1rem;">🌙 Theme</h4>
          <div style="display:flex; gap:10px; margin-bottom:12px;">
            <button id="theme-dark-btn" style="flex:1; padding:8px; background:#2a2d31; color:#fff; border:2px solid #666; border-radius:6px; cursor:pointer;">🌙 Dark</button>
            <button id="theme-light-btn" style="flex:1; padding:8px; background:#f0f2f5; color:#1c1e21; border:2px solid #ccc; border-radius:6px; cursor:pointer;">☀️ Light</button>
          </div>
          <label for="language-select" style="display:block; margin-bottom:8px;">🌐 Language / Язык:</label>
          <select id="language-select" style="width:100%;">
            <option value="en" ${currentLanguage === 'en' ? 'selected' : ''}>English</option>
            <option value="ru" ${currentLanguage === 'ru' ? 'selected' : ''}>Русский</option>
          </select>
        </div>
      </div>
      <div id="shop-panel" style="display:none;">
        <h3 style="text-align:center; margin-top:0;">🛒 ${lang.shopTitle}</h3>
        <div style="text-align:center; margin-bottom:12px; padding:10px; background:#0a0a0a; border-radius:6px; font-size:1.1rem;">
          <span id="shop-stars-display">${lang.stars}</span>: <b id="shop-stars" style="color:#2ecc40; font-size:1.3rem;">0</b> ⭐
        </div>
        <div id="shop-list" style="display:grid; grid-template-columns:repeat(auto-fill,minmax(90px,1fr)); gap:12px; margin-bottom:12px;"></div>
      </div>
    `;
    setupStartScreenButtons(startCallback);
    updateLeaderboard();
  } else {
    ui.innerHTML = '';
  }
}

function setupStartScreenButtons(startCallback) {
  const startBtn = document.getElementById('start-btn');
  if (startBtn) {
    startBtn.type = 'button';
    startBtn.addEventListener('click', (e) => { e.preventDefault(); try { startCallback(); } catch(err) { console.error(err); }});
  }

  const achievementsBtn = document.getElementById('achievements-btn');
  if (achievementsBtn) {
    achievementsBtn.type = 'button';
    achievementsBtn.addEventListener('click', (e) => {
      e.preventDefault();
      showAchievements();
    });
  }

  const profileBtn = document.getElementById('profile-btn');
  if (profileBtn) {
    profileBtn.type = 'button';
    profileBtn.addEventListener('click', (e) => {
      e.preventDefault();
      // Import profile module dynamically
      import('./profile.js').then(module => {
        module.showProfile();
      }).catch(err => console.error('Profile load error:', err));
    });
  }

  const shopBtn = document.getElementById('shop-btn');
  if (shopBtn) {
    shopBtn.type = 'button';
    shopBtn.addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById('leaderboard').style.display = 'none';
      document.getElementById('settings-panel').style.display = 'none';
      document.getElementById('shop-panel').style.display = 'block';
      renderShop();
    });
  }
  
  const ratingBtn = document.getElementById('rating-btn');
  if (ratingBtn) {
    ratingBtn.type = 'button';
    ratingBtn.addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById('shop-panel').style.display = 'none';
      document.getElementById('settings-panel').style.display = 'none';
      document.getElementById('leaderboard').style.display = 'block';
      updateLeaderboard(undefined, true); // showGlobal = true
    });
  }
  
  const settingsBtn = document.getElementById('settings-btn');
  if (settingsBtn) {
    settingsBtn.type = 'button';
    settingsBtn.addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById('shop-panel').style.display = 'none';
      document.getElementById('leaderboard').style.display = 'none';
      document.getElementById('settings-panel').style.display = 'block';
      renderSkins();
    });
  }

  const languageSelect = document.getElementById('language-select');
  if (languageSelect) {
    languageSelect.addEventListener('change', (e) => {
      setLanguage(e.target.value);
    });
  }
  
  const sfxVolumeSlider = document.getElementById('sfx-volume');
  if (sfxVolumeSlider) {
    sfxVolumeSlider.value = Math.round(soundManager.sfxVolume * 100);
    sfxVolumeSlider.addEventListener('input', (e) => {
      const volume = e.target.value / 100;
      soundManager.setVolume(volume);
      soundManager.playSelectSound();
    });
  }
  
  // Theme buttons
  const themeDarkBtn = document.getElementById('theme-dark-btn');
  const themeLightBtn = document.getElementById('theme-light-btn');
  
  if (themeDarkBtn) {
    themeDarkBtn.addEventListener('click', () => {
      setTheme('dark');
      soundManager.playSelectSound();
    });
  }
  
  if (themeLightBtn) {
    themeLightBtn.addEventListener('click', () => {
      setTheme('light');
      soundManager.playSelectSound();
    });
  }
  
  // Load saved theme
  loadTheme();
}

function renderShop() {
  const shopList = document.getElementById('shop-list');
  const starsInfo = document.getElementById('shop-stars');
  if (!shopList) return;

  // Get stars from localStorage (works even when not in game)
  const currentStars = Number(localStorage.getItem('snakeplus_stars') || 0);
  // Get unlocked skins from localStorage
  let unlockedSkins = ['#2ecc40'];
  try {
    const stored = localStorage.getItem('snakeplus_skins');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) unlockedSkins = parsed;
    }
  } catch(e) {}

  if (starsInfo) starsInfo.textContent = currentStars;

  const lang = translations[currentLanguage];

  shopList.innerHTML = SKINS_CATALOG.map(skin => {
    const owned = unlockedSkins.includes(skin.color);
    const canAfford = currentStars >= skin.price;
    const btnText = owned
      ? (currentLanguage === 'ru' ? 'Куплено' : 'Owned')
      : (skin.price === 0
          ? (currentLanguage === 'ru' ? 'Выбрано' : 'Selected')
          : skin.price + ' ⭐');
    const disabled = owned || !canAfford;
    const skinDisplayName = lang.skins[skin.name] || skin.name;

    return `
      <div style="text-align:center; padding:8px; border-radius:8px; border:1px solid #2ecc40; background:#0a0a0a; transition:all 0.2s ease;">
        <div style="width:60px; height:60px; margin:0 auto 6px; border-radius:6px; background:${skin.color}; border:2px solid #2ecc40; box-shadow:0 0 8px ${skin.color}80;"></div>
        <div style="font-size:10px; margin-bottom:6px; color:#ccc; height:18px; display:flex; align-items:center; justify-content:center; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${skinDisplayName}</div>
        <button class="shop-btn" data-color="${skin.color}" data-price="${skin.price}" style="padding:5px 8px; font-size:9px; background:${owned ? '#666' : (canAfford ? '#2ecc40' : '#555')}; color:white; font-weight:bold; opacity:${!canAfford && !owned ? '0.6' : '1'};" ${disabled ? 'disabled' : ''}>${btnText}</button>
      </div>
    `;
  }).join('');


  Array.from(shopList.querySelectorAll('.shop-btn:not(:disabled)')).forEach(btn => {
    btn.addEventListener('click', () => {
      const color = btn.getAttribute('data-color');
      const price = parseInt(btn.getAttribute('data-price'));
      
      // Buy skin using localStorage data
      let stars = Number(localStorage.getItem('snakeplus_stars') || 0);
      let unlocked = [];
      try {
        const stored = localStorage.getItem('snakeplus_skins');
        if (stored) unlocked = JSON.parse(stored);
      } catch(e) { unlocked = ['#2ecc40']; }
      
      if (unlocked.includes(color)) {
        alert(currentLanguage === 'ru' ? 'Уже куплено!' : 'Already owned!');
        return;
      }
      
      if (stars < price) {
        alert(currentLanguage === 'ru' ? 'Недостаточно звёзд!' : 'Not enough stars!');
        return;
      }
      
      // Deduct stars and add skin
      stars -= price;
      unlocked.push(color);
      
      localStorage.setItem('snakeplus_stars', String(stars));
      localStorage.setItem('snakeplus_skins', JSON.stringify(unlocked));
      
      alert(currentLanguage === 'ru' ? '✅ Куплено!' : '✅ Purchased!');
      
      // Update stars display
      if (starsInfo) starsInfo.textContent = stars;
      
      // Re-render shop
      renderShop();
      
      // Dispatch event to update UI if game is running
      try { window.dispatchEvent(new CustomEvent('skinsUpdated', { detail: { unlocked, stars } })); } catch(e) {}
    });
  });
}

function renderSkins(state) {
  const skinsList = document.getElementById('skins-list');
  if (!skinsList) return;
  
  let unlocked = null;
  if (state && Array.isArray(state.unlockedSkins)) unlocked = state.unlockedSkins;
  else {
    try {
      const raw = localStorage.getItem('snakeplus_skins');
      const parsed = raw ? JSON.parse(raw) : null;
      if (Array.isArray(parsed) && parsed.length) unlocked = parsed;
      else if (typeof parsed === 'string' && parsed) unlocked = [parsed];
      else unlocked = ['#2ecc40'];
    } catch (e) { unlocked = ['#2ecc40']; }
  }
  
  let current = (state && state.snakeColor) ? state.snakeColor : (localStorage.getItem('snakeplus_skin') || unlocked[0] || '#2ecc40');
  
  skinsList.innerHTML = unlocked.map(function(color) {
    var border = (color === current) ? '3px solid #ffe066' : '2px solid #2ecc40';
    var boxShadow = (color === current) ? '0 0 12px #ffe06680' : '0 0 6px ' + color + '80';
    return '<div class="skin-choice" data-color="' + color + '" style="width:56px; height:56px; border-radius:8px; background:' + color + '; border:' + border + '; cursor:pointer; box-shadow:' + boxShadow + '; transition:all 0.2s ease;"></div>';
  }).join('');
  
  Array.from(skinsList.children).forEach(el => {
    el.onclick = () => {
      localStorage.setItem('snakeplus_skin', el.dataset.color);
      if(state) { state.snakeColor = el.dataset.color; }
      renderSkins(state);
    };
  });
}

window.addEventListener('skinsUpdated', function(ev) {
  if (document.getElementById('skins-list')) renderSkins();
  if (document.getElementById('shop-list')) renderShop();
});

async function showGameOver(score, restartCallback, newAchievements = []) {
  const ui = document.getElementById('ui');
  const lang = translations[currentLanguage];
  const rank = getRank(score);

  // Prepare share text
  const shareText = `🐍 Snake+\\n🏆 Score: ${score}\\n🏅 Rank: ${rank.name}\\n#SnakePlus`;

  // FIRST: Create UI with all elements
  ui.innerHTML = `
    <h2 style="animation: gameOverPulse 1.5s ease-in-out infinite;">💀 ${lang.gameOver}</h2>
    <div style="width:100%; max-width:380px; background:linear-gradient(135deg, #0f1419 0%, #141618 100%); border:1px solid #e74c3c; border-radius:10px; padding:20px; margin:16px 0; text-align:center; box-shadow:0 4px 20px rgba(231, 76, 60, 0.3); animation: slideIn 0.4s ease-out; color: #fff;">
      <div style="margin:10px 0; font-size:1.1rem; color: #fff;">${lang.score}: <b style="color:#2ecc40; font-size:1.4rem; text-shadow:0 0 10px rgba(46,204,64,0.5);">${score}</b></div>
      <div style="margin:10px 0; font-size:1rem; color: #fff;">🏅 ${rank.name}</div>
    </div>

    ${newAchievements.length > 0 ? `
      <div style="width:100%; max-width:380px; background:linear-gradient(135deg, #1f2326 0%, #23272b 100%); border:2px solid #f1c40f; border-radius:10px; padding:16px; margin:12px 0; animation: slideIn 0.5s ease-out; box-shadow:0 0 20px rgba(241,196,15,0.3);">
        <h4 style="text-align:center; margin:0 0 12px 0; color:#f1c40f; font-size:1.1rem;">🎉 New Achievements!</h4>
        ${newAchievements.map(ach => `
          <div style="display:flex; align-items:center; gap:10px; padding:10px; margin:6px 0; background:#141618; border-radius:8px; border:1px solid ${ach.rarity === 'legendary' ? '#f1c40f' : (ach.rarity === 'epic' ? '#9b59b6' : '#3498db')};">
            <div style="font-size:1.8rem;">${ach.icon}</div>
            <div style="flex:1;">
              <div style="font-weight:bold; color:#fff; font-size:0.95rem;">${ach.name}</div>
              <div style="font-size:0.8rem; color:#aaa;">${ach.description}</div>
            </div>
            <div style="color:#2ecc40; font-weight:bold;">+${ach.reward}⭐</div>
          </div>
        `).join('')}
      </div>
    ` : ''}

    <div style="width:100%; max-width:380px; background:#141618; border:1px solid #2ecc40; border-radius:8px; padding:16px; margin:12px 0; animation: slideIn 0.5s ease-out;">
      <h4 style="text-align:center; margin-top:0;">🎨 ${lang.yourSkins}</h4>
      <div id="skins-list" style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;"></div>
    </div>
    <div style="display:flex; flex-direction:column; gap:10px; width:100%; max-width:380px; margin-top:16px; animation: slideIn 0.6s ease-out;">
      <button id="restart-btn" style="width:100%;">🔄 ${lang.playAgain}</button>
      <button id="menu-btn" style="width:100%;">🏠 ${lang.menu}</button>
      <button id="share-btn" style="width:100%; background:linear-gradient(90deg, #0088cc 0%, #0066aa 100%);">📤 ${lang.share || 'Share'}</button>
    </div>
  `;

  renderSkins();
  document.getElementById('restart-btn').onclick = restartCallback;
  document.getElementById('menu-btn').onclick = () => showStartScreen(true, restartCallback);

  // Share button
  const shareBtn = document.getElementById('share-btn');
  if (shareBtn) {
    shareBtn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();

      const shareMessage = `🐍 Snake+\n\n🏆 Score: ${score}\n🏅 Rank: ${rank.name}\n\nCan you beat my score? 🎮`;

      copyToClipboard(shareMessage);
    };
  }
}

// Helper function to copy to clipboard with visual feedback
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    // Show toast notification
    showToast('✅ Скопировано в буфер!\nТеперь вставьте в чат (Ctrl+V / долгий тап)');
  }).catch(() => {
    // Final fallback - show alert
    alert('📋 Скопируйте текст:\n\n' + text);
  });
}

// Show toast notification
function showToast(message, duration = 3000) {
  // Remove existing toast if any
  const existing = document.getElementById('toast-notification');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'toast-notification';
  toast.innerHTML = message.replace('\n', '<br>');
  toast.style.cssText = `
    position: fixed;
    bottom: 80px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(20, 22, 24, 0.95);
    border: 2px solid #2ecc40;
    border-radius: 12px;
    padding: 16px 24px;
    color: #fff;
    font-size: 0.95rem;
    text-align: center;
    z-index: 10000;
    box-shadow: 0 4px 20px rgba(46, 204, 64, 0.4);
    animation: slideUp 0.3s ease-out;
    max-width: 80%;
  `;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

async function updateLeaderboard(newScore, showGlobal = false) {
  // Save score locally first
  let scores = JSON.parse(localStorage.getItem('snakeplus_scores') || '[]');
  if (typeof newScore !== 'undefined' && newScore !== null && typeof newScore === 'number') {
    scores.push(newScore);
    scores = Array.from(new Set(scores)).sort((a, b) => b - a).slice(0, 5);
    localStorage.setItem('snakeplus_scores', JSON.stringify(scores));
  }

  const lb = document.getElementById('leaderboard');
  if (!lb) return scores;

  const lang = translations[currentLanguage];
  
  // If showGlobal is true, fetch from server
  if (showGlobal && ONLINE_MODE) {
    try {
      const serverAvailable = await isServerAvailable();
      if (serverAvailable) {
        const result = await getLeaderboard(50);
        if (result.success && result.leaderboard && result.leaderboard.length > 0) {
          let html = '<h4 style="margin:0 0 12px 0; text-align:center; color: var(--accent-color);">🏆 Global Leaderboard</h4>';
          html += result.leaderboard.map(function(entry, i) {
            const medal = i === 0 ? '🥇' : (i === 1 ? '🥈' : (i === 2 ? '🥉' : '#' + (i+1)));
            const rank = getRank(entry.score);
            let displayName = entry.username || 'Anonymous';
            if (entry.telegram_user) {
              try {
                const tgUser = JSON.parse(entry.telegram_user);
                displayName = tgUser.username || tgUser.first_name || displayName;
              } catch(e) {}
            }
            return '<div style="padding:12px; background:var(--bg-tertiary); border-radius:8px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;"><div style="display:flex; align-items:center; gap:12px;"><span style="font-size:1.2rem; min-width:30px;">' + medal + '</span><div><div style="color:#fff; font-weight:bold;">' + displayName + '</div><div style="color:' + rank.color + '; font-size:0.75rem;">' + rank.name + '</div></div></div><span style="color:var(--accent-color); font-weight:bold; font-size:1.1rem;">' + entry.score + '</span></div>';
          }).join('');
          lb.innerHTML = html;
          return scores;
        }
      }
    } catch (err) {
      console.log('Global leaderboard not available, using local');
    }
  }
  
  // Local personal best
  const bestScore = scores.length > 0 ? scores[0] : 0;
  const rank = getRank(bestScore);
  
  let html = '<h4 style="margin:0 0 12px 0; text-align:center; color: var(--accent-color);">🏆 Personal Best</h4>';
  
  html += '<div style="padding:16px; background:var(--bg-card); border-radius:8px; border:1px solid var(--accent-color); text-align:center;">';
  html += '<div style="font-size:2rem; color:var(--accent-color); font-weight:bold;">' + bestScore + '</div>';
  html += '<div style="color:var(--text-secondary); margin-top:8px;">Best Score</div>';
  html += '<div style="color:' + rank.color + '; margin-top:4px; font-size:0.9rem;">' + rank.name + '</div>';
  html += '</div>';
  
  // Show recent games
  if (scores.length > 1) {
    html += '<div style="margin-top:16px;"><h5 style="color:var(--text-muted); margin-bottom:8px;">Recent Games</h5>';
    html += scores.slice(1, 4).map(function(s, i) {
      const r = getRank(s);
      return '<div style="padding:8px 12px; display:flex; justify-content:space-between; align-items:center; background:var(--bg-tertiary); border-radius:6px; margin-bottom:6px;"><span style="color:var(--text-secondary); font-size:0.9rem;">Game ' + (i+2) + '</span><span style="color:#fff; font-weight:bold;">' + s + '</span><span style="color:' + r.color + '; font-size:0.75rem;">' + r.name + '</span></div>';
    }).join('');
    html += '</div>';
  }
  
  if (scores.length === 0) {
    html += '<div style="text-align:center; color:var(--text-muted); padding:20px;">No games played yet</div>';
  }
  
  lb.innerHTML = html;
  return scores;
}

export { updateUI, showGameOver, showStartScreen, setGameStateUI as setGameState, loadTheme };

// Show achievements screen
function showAchievements() {
  const ui = document.getElementById('ui');
  const lang = translations[currentLanguage];
  
  // Get achievements from mechanics
  import('./mechanics.js').then(({ ACHIEVEMENTS, getUnlockedAchievements, getPlayerStats }) => {
    const unlocked = getUnlockedAchievements();
    const stats = getPlayerStats();
    
    ui.innerHTML = `
      <h2>🏆 ${lang.achievements}</h2>
      <div style="width:100%; max-width:380px; max-height:60vh; overflow-y:auto;">
        ${ACHIEVEMENTS.map(ach => {
          const isUnlocked = unlocked.includes(ach.id);
          const rarityColors = {
            common: '#95a5a6',
            rare: '#3498db',
            epic: '#9b59b6',
            legendary: '#f1c40f'
          };
          const color = rarityColors[ach.rarity] || '#fff';
          
          return `
            <div style="display:flex; align-items:center; gap:12px; padding:12px; margin-bottom:8px; background:${isUnlocked ? '#1f2326' : '#141618'}; border:2px solid ${color}; border-radius:8px; opacity:${isUnlocked ? 1 : 0.5};">
              <div style="font-size:2rem; min-width:40px; text-align:center;">${isUnlocked ? ach.icon : '🔒'}</div>
              <div style="flex:1;">
                <div style="font-weight:bold; color:${color}; font-size:1rem;">${ach.name}</div>
                <div style="font-size:0.85rem; color:#aaa;">${ach.description}</div>
              </div>
              <div style="text-align:right; min-width:50px;">
                <div style="color:#2ecc40; font-weight:bold;">+${ach.reward}⭐</div>
                <div style="font-size:0.75rem; color:${color};">${ach.rarity.toUpperCase()}</div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
      <div style="display:flex; flex-direction:column; gap:10px; width:100%; max-width:380px; margin-top:16px;">
        <button id="back-achievements-btn" style="width:100%;">🏠 ${lang.menu || 'Menu'}</button>
      </div>
    `;
    
    document.getElementById('back-achievements-btn').onclick = () => {
      if (window.showMainMenu) {
        window.showMainMenu();
      }
    };
  });
}