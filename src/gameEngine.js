// gameEngine.js
// Main game loop and state management
import { initRenderer, renderGame, spawnCrashParticles, spawnFoodParticles, spawnComboParticles, spawnBoosterParticles } from './renderer.js';
import { setupControls } from './controls.js';
import { updateMechanics, getInitialState, getRank, BOOSTERS, incrementGamesPlayed, updateGameStats, checkAchievements } from './mechanics.js';
import { updateUI, showGameOver, showStartScreen, setGameState, loadTheme } from './ui.js';
import { soundManager, playEatSound, playIceBreakSound, playCrashSound } from './audio.js';
import { saveScore, isServerAvailable } from './api.js';
import { ONLINE_MODE } from './config.js';

// Get Telegram user data
function getTelegramUser() {
  if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe) {
    return window.Telegram.WebApp.initDataUnsafe.user || null;
  }
  return null;
}

let gameState = null;
let gameInterval = null;
let lastMoveTime = 0;
let gameOverTime = 0;
let serverAvailable = null;

// Initialize Telegram WebApp
function initTelegram() {
  if (window.Telegram && window.Telegram.WebApp) {
    const tg = window.Telegram.WebApp;
    
    // Ready first
    tg.ready();
    
    // Expand to full height
    tg.expand();
    
    // Set colors to match our theme (only if supported)
    try {
      const bgColor = tg.themeParams?.bg_color || '#0f1419';
      if (tg.setHeaderColor) tg.setHeaderColor(bgColor);
      if (tg.setBackgroundColor) tg.setBackgroundColor(bgColor);
    } catch(e) {}
    
    // CRITICAL: Disable vertical swipes (iOS/Android) - only if supported
    try {
      if (tg.disableVerticalSwipes) {
        tg.disableVerticalSwipes();
        console.log('Vertical swipes disabled');
      }
    } catch(e) {}
    
    // CRITICAL: Enable sticky app mode (Telegram 7.7+)
    // This prevents swipe-down from closing the app
    try {
      if (tg.platform !== 'web' && tg.platform !== 'weba' && tg.platform !== 'webk' && tg.platform !== 'tdesktop') {
        // Apply sticky app class
        document.documentElement.classList.add('sticky-app');
        document.body.classList.add('sticky-app');
        console.log('Sticky App Mode enabled for platform:', tg.platform);
      }
    } catch(e) {}

    // Apply Telegram theme colors
    if (tg.themeParams) {
      document.documentElement.style.setProperty('--tg-bg-color', tg.themeParams.bg_color || '#0f1419');
      document.documentElement.style.setProperty('--tg-text-color', tg.themeParams.text_color || '#ffffff');
      document.documentElement.style.setProperty('--tg-button-color', tg.themeParams.button_color || '#2ecc40');
      document.documentElement.style.setProperty('--tg-hint-color', tg.themeParams.hint_color || '#666666');
      document.documentElement.style.setProperty('--tg-secondary-bg-color', tg.themeParams.secondary_bg_color || '#1f2326');
    }

    // Store user data
    if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
      const user = tg.initDataUnsafe.user;
      localStorage.setItem('snakeplus_telegram_user', JSON.stringify({
        id: user.id,
        username: user.username || user.first_name || 'Anonymous',
        first_name: user.first_name,
        last_name: user.last_name,
        language_code: user.language_code || 'en'
      }));

      // Set language from Telegram
      if (user.language_code && ['en', 'ru'].includes(user.language_code.toLowerCase())) {
        localStorage.setItem('snakeplus_language', user.language_code.toLowerCase());
      }

      console.log('Telegram user:', user);
    }

    // Enable closing confirmation (if supported)
    try {
      if (tg.enableClosingConfirmation) {
        tg.enableClosingConfirmation();
      }
    } catch (e) {
      // Not supported in older Telegram versions
    }

    console.log('Telegram WebApp initialized');
  }

  // Load saved theme
  loadTheme();
}

// Check server availability on load
async function checkServer() {
  if (ONLINE_MODE) {
    serverAvailable = await isServerAvailable();
    console.log('Server available:', serverAvailable);
  } else {
    serverAvailable = false;
  }
}

function startGame() {
  console.log('startGame invoked');
  // Initialize sound system on first user interaction
  soundManager.init();
  
  gameState = getInitialState();
  setupControls(gameState, onDirectionChange);
  if (gameInterval) cancelAnimationFrame(gameInterval);
  lastMoveTime = performance.now();
  showStartScreen(false);
  gameInterval = requestAnimationFrame(gameLoop);
}

function gameLoop(now) {
  const moveDelay = 1000 / gameState.speed;
  if (now - lastMoveTime >= moveDelay) {
    const result = updateMechanics(gameState);
    
    // Trigger sounds and effects for game events
    if (gameState.lastEventFood) {
      // Check if bonus food
      if (gameState.food && gameState.food.isBonus) {
        soundManager.playBonusEatSound();
      } else if (gameState.food && gameState.food.boosterType) {
        // Booster pickup sound
        soundManager.playStarCollectSound();
        spawnBoosterParticles(gameState.food.x, gameState.food.y, gameState.gridSize, BOOSTERS);
      } else {
        playEatSound();
      }
      // Spawn food particles
      spawnFoodParticles(gameState.food.x, gameState.food.y, gameState.gridSize, gameState.food.isBonus);
      
      // Combo sound and particles
      if (gameState.comboMultiplier > 1) {
        soundManager.playComboSound(gameState.comboMultiplier);
        spawnComboParticles(gameState.food.x, gameState.food.y, gameState.gridSize, gameState.comboMultiplier);
      }
    }
    if (gameState.lastEventIceBreak) {
      playIceBreakSound();
    }
    if (gameState.lastEventBooster) {
      gameState.lastEventBooster = false; // Reset flag
    }
    
    renderGame(gameState);
    updateUI(gameState);
    lastMoveTime = now;
    
    if (result.gameOver) {
      playCrashSound();
      if (result.crashHead && gameState && gameState.gridSize) {
        spawnCrashParticles(result.crashHead[0], result.crashHead[1], gameState.gridSize);
      }
      gameOverTime = now;
      // Keep rendering for ~800ms so crash particles are visible, then show game over screen
      gameInterval = requestAnimationFrame(function particleLoop(t) {
        renderGame(gameState);
        if (t - gameOverTime < 800) {
          gameInterval = requestAnimationFrame(particleLoop);
        } else {
          // Update game stats and check achievements
          incrementGamesPlayed();
          updateGameStats(gameState.score, gameState.comboMultiplier, gameState.booster ? gameState.booster.id : null);
          
          // Check and unlock achievements
          const newAchievements = checkAchievements();
          
          // Save score if online mode and server available
          console.log('Saving score...', {
            ONLINE_MODE,
            serverAvailable,
            score: gameState.score,
            stars: gameState.stars
          });
          
          if (ONLINE_MODE && serverAvailable) {
            const rank = getRank(gameState.score);
            const tgUser = getTelegramUser();
            console.log('Sending to server:', { score: gameState.score, rank: rank.name, hasTgUser: !!tgUser });
            saveScore(gameState.score, rank.name, tgUser)
              .then(() => console.log('Score saved successfully!'))
              .catch(err => console.error('Failed to save score:', err));
            // Save stars locally
            localStorage.setItem('snakeplus_stars', String(Math.floor(gameState.stars)));
          } else {
            console.log('Not saving - ONLINE_MODE:', ONLINE_MODE, 'serverAvailable:', serverAvailable);
            // Still save stars locally
            localStorage.setItem('snakeplus_stars', String(Math.floor(gameState.stars)));
          }
          
          // Pass new achievements to showGameOver
          showGameOver(gameState.score, startGame, newAchievements).catch(err => console.error('showGameOver error:', err));
        }
      });
      return;
    }
  } else {
    renderGame(gameState);
    updateUI(gameState);
  }
  gameInterval = requestAnimationFrame(gameLoop);
}

function onDirectionChange(dir) {
  if (gameState) gameState.nextDirection = dir;
}

// Global swipe controls - work everywhere (menu, game, etc)
function initGlobalSwipeControls() {
  let startX = 0, startY = 0;
  let isSwiping = false;
  let swipeDirection = null;

  document.addEventListener('touchstart', (e) => {
    console.log('👆 TOUCH START');
    if (e.touches.length === 1) {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      isSwiping = false;
      swipeDirection = null;
      console.log('Start:', startX, startY);
    }
  });

  document.addEventListener('touchmove', (e) => {
    if (e.touches.length === 1 && !swipeDirection) {
      const touch = e.touches[0];
      const dx = touch.clientX - startX;
      const dy = touch.clientY - startY;
      console.log('👆 MOVE:', dx.toFixed(0), dy.toFixed(0));

      if (!isSwiping && (Math.abs(dx) > 30 || Math.abs(dy) > 30)) {
        isSwiping = true;
        if (Math.abs(dx) > Math.abs(dy)) {
          swipeDirection = dx > 0 ? 'right' : 'left';
        } else {
          swipeDirection = dy > 0 ? 'down' : 'up';
        }
        console.log('🎯 SWIPE:', swipeDirection, 'dx:', dx.toFixed(0), 'dy:', dy.toFixed(0));
      }
    }
  });

  document.addEventListener('touchend', (e) => {
    console.log('👆 TOUCH END');
    if (isSwiping && swipeDirection) {
      if (gameState) {
        gameState.nextDirection = swipeDirection;
        console.log('✅ Direction changed to:', swipeDirection);
      } else {
        console.log('❌ No gameState!');
      }
    }
    isSwiping = false;
    swipeDirection = null;
  });
  
  console.log('✅ Global swipe controls initialized');
}

window.onload = async () => {
  initTelegram();
  await checkServer();
  initRenderer();
  initGlobalSwipeControls(); // Global swipes work everywhere
  showStartScreen(true, startGame);
};

// Global function for profile back button
window.showMainMenu = () => {
  showStartScreen(true, startGame);
};
  
