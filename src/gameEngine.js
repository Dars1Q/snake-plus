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

    // Set colors (ignore errors on old versions)
    try {
      const bgColor = tg.themeParams?.bg_color || '#0f1419';
      if (tg.setHeaderColor) tg.setHeaderColor(bgColor);
      if (tg.setBackgroundColor) tg.setBackgroundColor(bgColor);
    } catch(e) {}

    // CRITICAL: Disable vertical swipes to prevent app closing (Telegram 7.7+)
    try {
      if (tg.disableVerticalSwipes) {
        tg.disableVerticalSwipes();
        console.log('✅ Vertical swipes disabled by Telegram');
      }
    } catch(e) {
      console.log('ℹ️ disableVerticalSwipes not available');
    }

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

    console.log('Telegram WebApp initialized');
  }

  // Load saved theme
  loadTheme();
}

// Check Firebase availability on load
async function checkServer() {
  serverAvailable = await isServerAvailable();
  console.log('Firebase available:', serverAvailable);
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
          updateGameStats(gameState.score, gameState.comboMultiplier, gameState.activeBoosterEffect ? gameState.activeBoosterEffect.id : null);

          // Check and unlock achievements
          const newAchievements = checkAchievements();

          // Save stars locally
          localStorage.setItem('snakeplus_stars', String(Math.floor(gameState.stars)));

          // Save score to Firebase (using global function)
          if (window.saveScoreToFirebase) {
            const rank = getRank(gameState.score);
            const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user || null;
            window.saveScoreToFirebase(gameState.score, rank.name, tgUser);
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

// Global swipe controls - work ONLY during gameplay
let swipeStartX = 0, swipeStartY = 0;
let swipeIsSwiping = false;
let swipeDirection = null;

function initGlobalSwipeControls() {
  document.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      swipeStartX = e.touches[0].clientX;
      swipeStartY = e.touches[0].clientY;
      swipeIsSwiping = false;
      swipeDirection = null;
    }
  }, { passive: true });

  document.addEventListener('touchmove', (e) => {
    // Only intercept swipes when game is actively running (not in menu, not game over)
    const gameIsActive = gameState && !gameState.gameOver;

    if (gameIsActive && e.touches.length === 1 && !swipeDirection) {
      const touch = e.touches[0];
      const dx = touch.clientX - swipeStartX;
      const dy = touch.clientY - swipeStartY;

      if (!swipeIsSwiping && (Math.abs(dx) > 30 || Math.abs(dy) > 30)) {
        swipeIsSwiping = true;
        if (Math.abs(dx) > Math.abs(dy)) {
          swipeDirection = dx > 0 ? 'right' : 'left';
        } else {
          swipeDirection = dy > 0 ? 'down' : 'up';
        }
        if (gameState) {
          gameState.nextDirection = swipeDirection;
        }
        // BLOCK scroll during game swipe
        e.preventDefault();
      }

      // Always prevent default during active game swipe
      if (swipeIsSwiping) {
        e.preventDefault();
      }
    }
    // When NOT in game - allow normal scrolling (don't call preventDefault)
  }, { passive: false });

  document.addEventListener('touchend', (e) => {
    swipeIsSwiping = false;
    swipeDirection = null;
  }, { passive: true });
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
  
