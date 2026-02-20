// mechanics.js
// Game logic, mechanics, and balance

const GRID_SIZE = 20;
const BASE_SPEED = 5; // cells/sec
const SPEED_INCREASE_FOOD = 5;
const COMBO_WINDOW = 2500; // ms
const BONUS_FOOD_CHANCE = 0.12;
const ICE_TILE_CHANCE = 0.02;
const ICE_RESPAWN_DELAY = 4000;

// Booster types and configuration
const BOOSTERS = {
  SLOW_MOTION: { 
    id: 'slow', 
    name: 'Slow Motion', 
    duration: 8000, 
    color: '#3498db',
    icon: '🐌',
    effect: 'speed',
    value: 0.5 // 50% speed
  },
  MAGNET: { 
    id: 'magnet', 
    name: 'Magnet', 
    duration: 10000, 
    color: '#e74c3c',
    icon: '🧲',
    effect: 'magnet',
    value: 3 // 3 cells range
  },
  DOUBLE_POINTS: { 
    id: 'double', 
    name: '2x Points', 
    duration: 12000, 
    color: '#f1c40f',
    icon: '⭐',
    effect: 'multiplier',
    value: 2
  },
  SHIELD: { 
    id: 'shield', 
    name: 'Shield', 
    duration: 5000, 
    color: '#9b59b6',
    icon: '🛡️',
    effect: 'shield',
    value: 1 // one hit protection
  },
};

const BOOSTER_SPAWN_CHANCE = 0.08; // 8% chance to spawn booster instead of bonus food

// Achievements system
const ACHIEVEMENTS = [
  // Score achievements
  { id: 'score_100', name: 'Первые 100', description: 'Наберите 100 очков', icon: '🥉', condition: (stats) => stats.bestScore >= 100, reward: 10, rarity: 'common' },
  { id: 'score_500', name: 'Полутонка', description: 'Наберите 500 очков', icon: '🥈', condition: (stats) => stats.bestScore >= 500, reward: 25, rarity: 'common' },
  { id: 'score_1000', name: 'Тысячник', description: 'Наберите 1000 очков', icon: '🥇', condition: (stats) => stats.bestScore >= 1000, reward: 50, rarity: 'rare' },
  { id: 'score_5000', name: 'Мастер', description: 'Наберите 5000 очков', icon: '🏆', condition: (stats) => stats.bestScore >= 5000, reward: 100, rarity: 'epic' },
  { id: 'score_10000', name: 'Легенда', description: 'Наберите 10000 очков', icon: '👑', condition: (stats) => stats.bestScore >= 10000, reward: 200, rarity: 'legendary' },
  
  // Combo achievements
  { id: 'combo_5', name: 'Комбо-мастер', description: 'Получите комбо x5', icon: '🔥', condition: (stats) => stats.maxCombo >= 5, reward: 15, rarity: 'common' },
  { id: 'combo_10', name: 'Неудержимый', description: 'Получите комбо x10', icon: '💥', condition: (stats) => stats.maxCombo >= 10, reward: 30, rarity: 'rare' },
  { id: 'combo_20', name: 'Бог комбо', description: 'Получите комбо x20', icon: '⚡', condition: (stats) => stats.maxCombo >= 20, reward: 75, rarity: 'epic' },
  
  // Games played achievements
  { id: 'games_10', name: 'Новичок', description: 'Сыграйте 10 игр', icon: '🎮', condition: (stats) => stats.totalGames >= 10, reward: 10, rarity: 'common' },
  { id: 'games_50', name: 'Любитель', description: 'Сыграйте 50 игр', icon: '🕹️', condition: (stats) => stats.totalGames >= 50, reward: 25, rarity: 'common' },
  { id: 'games_100', name: 'Ветеран', description: 'Сыграйте 100 игр', icon: '🎯', condition: (stats) => stats.totalGames >= 100, reward: 50, rarity: 'rare' },
  { id: 'games_500', name: 'Хардкорщик', description: 'Сыграйте 500 игр', icon: '💀', condition: (stats) => stats.totalGames >= 500, reward: 100, rarity: 'epic' },
  
  // Booster achievements
  { id: 'booster_slow', name: 'Медленно и стабильно', description: 'Используйте Slow Motion', icon: '🐌', condition: (stats) => stats.boostersUsed.includes('slow'), reward: 15, rarity: 'common' },
  { id: 'booster_magnet', name: 'Магнит', description: 'Используйте Magnet', icon: '🧲', condition: (stats) => stats.boostersUsed.includes('magnet'), reward: 15, rarity: 'common' },
  { id: 'booster_double', name: 'Удвоитель', description: 'Используйте 2x Points', icon: '⭐', condition: (stats) => stats.boostersUsed.includes('double'), reward: 15, rarity: 'common' },
  { id: 'booster_shield', name: 'Неуязвимый', description: 'Используйте Shield', icon: '🛡️', condition: (stats) => stats.boostersUsed.includes('shield'), reward: 15, rarity: 'common' },
  
  // Special achievements
  { id: 'skin_collector', name: 'Коллекционер', description: 'Купите 5 скинов', icon: '🎨', condition: (stats) => stats.skinsOwned >= 5, reward: 50, rarity: 'rare' },
  { id: 'skin_master', name: 'Модник', description: 'Купите 10 скинов', icon: '👔', condition: (stats) => stats.skinsOwned >= 10, reward: 100, rarity: 'epic' },
  { id: 'first_blood', name: 'Первая кровь', description: 'Умрите в первый раз', icon: '💀', condition: (stats) => stats.totalGames >= 1, reward: 5, rarity: 'common' },
];

// Rank system configuration
const RANKS = [
  { name: 'Bronze I', minScore: 0, color: '#cd7f32' },
  { name: 'Bronze II', minScore: 50, color: '#cd7f32' },
  { name: 'Bronze III', minScore: 100, color: '#cd7f32' },
  { name: 'Silver I', minScore: 200, color: '#c0c0c0' },
  { name: 'Silver II', minScore: 350, color: '#c0c0c0' },
  { name: 'Silver III', minScore: 500, color: '#c0c0c0' },
  { name: 'Gold I', minScore: 750, color: '#ffd700' },
  { name: 'Gold II', minScore: 1000, color: '#ffd700' },
  { name: 'Gold III', minScore: 1500, color: '#ffd700' },
  { name: 'Platinum I', minScore: 2000, color: '#e5e4e2' },
  { name: 'Platinum II', minScore: 3000, color: '#e5e4e2' },
  { name: 'Platinum III', minScore: 4000, color: '#e5e4e2' },
  { name: 'Diamond I', minScore: 5000, color: '#b9f2ff' },
  { name: 'Diamond II', minScore: 7500, color: '#b9f2ff' },
  { name: 'Diamond III', minScore: 10000, color: '#b9f2ff' },
  { name: 'Master', minScore: 15000, color: '#ff6b6b' },
  { name: 'Grand Master', minScore: 25000, color: '#ff6b6b' },
  { name: 'Legend', minScore: 50000, color: '#a855f7' },
];

const SKINS_CATALOG = [
  { color: '#2ecc40', name: 'Classic', price: 0, rarity: 'common' },
  { color: '#e67e22', name: 'Orange', price: 50, rarity: 'common' },
  { color: '#9b59b6', name: 'Purple', price: 75, rarity: 'rare' },
  { color: '#3498db', name: 'Blue', price: 50, rarity: 'common' },
  { color: '#f1c40f', name: 'Gold', price: 100, rarity: 'rare' },
  { color: '#e84393', name: 'Pink', price: 60, rarity: 'common' },
  { color: '#1abc9c', name: 'Turquoise', price: 80, rarity: 'rare' },
  { color: '#e74c3c', name: 'Red', price: 40, rarity: 'common' },
  // New skins
  { color: '#16a085', name: 'Teal', price: 70, rarity: 'rare' },
  { color: '#2c3e50', name: 'Midnight', price: 90, rarity: 'epic' },
  { color: '#c0392b', name: 'Crimson', price: 85, rarity: 'rare' },
  { color: '#8e44ad', name: 'Wisteria', price: 95, rarity: 'epic' },
  { color: '#27ae60', name: 'Emerald', price: 110, rarity: 'epic' },
  { color: '#d35400', name: 'Pumpkin', price: 65, rarity: 'common' },
  { color: '#7f8c8d', name: 'Silver', price: 120, rarity: 'legendary' },
  { color: '#00cec9', name: 'Cyan', price: 75, rarity: 'rare' },
  { color: '#fd79a8', name: 'Magenta', price: 80, rarity: 'rare' },
  { color: '#6c5ce7', name: 'Indigo', price: 100, rarity: 'epic' },
];

const STARS_PER_POINT = 0.1;
const STARS_FOR_MILESTONE = 10;

function getRank(score) {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (score >= RANKS[i].minScore) {
      return RANKS[i];
    }
  }
  return RANKS[0];
}

function getInitialState() {
  // Load unlocked skins and stars from localStorage
  let unlocked = ['#2ecc40']; // Classic skin by default (always unlocked)
  try {
    const storedSkins = JSON.parse(localStorage.getItem('snakeplus_skins') || 'null');
    if (Array.isArray(storedSkins) && storedSkins.length) {
      unlocked = storedSkins;
    }
    // Ensure Classic is always in unlocked list
    if (!unlocked.includes('#2ecc40')) {
      unlocked.unshift('#2ecc40');
    }
  } catch(e) {}
  
  let storedStars = localStorage.getItem('snakeplus_stars');
  const stars = storedStars ? Number(storedStars) : 0;
  
  // Get selected skin
  let selectedSkin = '#2ecc40';
  try {
    const stored = localStorage.getItem('snakeplus_skin');
    if (stored && unlocked.includes(stored)) {
      selectedSkin = stored;
    }
  } catch(e) {}
  
  // Load best score for rank calculation
  let bestScore = 0;
  try {
    const scores = JSON.parse(localStorage.getItem('snakeplus_scores') || '[]');
    bestScore = scores.length > 0 ? scores[0] : 0;
  } catch(e) {}
  
  const currentRank = getRank(bestScore);

  return {
    gridSize: GRID_SIZE,
    snake: [[10, 10]],
    direction: 'right',
    nextDirection: 'right',
    food: spawnFood([], []),
    booster: null, // Current active booster
    score: 0,
    comboMultiplier: 1,
    comboTimer: 0,
    bonusActive: false,
    snakeColor: selectedSkin,
    unlockedSkins: unlocked,
    iceTiles: spawnIceTiles(),
    pendingIceRespawns: [],
    speed: BASE_SPEED,
    baseSpeed: BASE_SPEED, // Store base speed for booster reset
    gameOver: false,
    lastFoodTime: performance.now(),
    lastEventFood: false,
    lastEventIceBreak: false,
    lastEventBooster: false,
    stars: stars,
    lastScoreCheckpoint: 0,
    rank: currentRank,
    bestScore: bestScore,
    shieldActive: false, // Shield protection
  };
}

function updateMechanics(state) {
  // Reset event flags for this tick
  state.lastEventFood = false;
  state.lastEventIceBreak = false;

  // Direction update
  if (isOpposite(state.direction, state.nextDirection)) {
    // Ignore reverse
  } else {
    state.direction = state.nextDirection;
  }
  // Move snake
  const head = [...state.snake[0]];
  switch (state.direction) {
    case 'up': head[1]--; break;
    case 'down': head[1]++; break;
    case 'left': head[0]--; break;
    case 'right': head[0]++; break;
  }
  // Wrap around
  head[0] = (head[0] + state.gridSize) % state.gridSize;
  head[1] = (head[1] + state.gridSize) % state.gridSize;
  
  // Check collision with body (shield can protect)
  if (state.snake.some(([x, y]) => x === head[0] && y === head[1])) {
    if (state.shieldActive) {
      // Shield protects - remove last segment instead of dying
      state.shieldActive = false;
      state.booster = null; // Remove booster
      state.snake.pop(); // Remove tail segment as "damage"
      console.log('Shield activated!');
    } else {
      state.gameOver = true;
      return { gameOver: true, crashHead: head, isCrash: true };
    }
  }
  state.snake.unshift(head);
  // Food
  if (head[0] === state.food.x && head[1] === state.food.y) {
    const now = performance.now();

    // Combo - check BEFORE updating lastFoodTime
    if (now - state.lastFoodTime < COMBO_WINDOW) {
      state.comboMultiplier++;
    } else {
      state.comboMultiplier = 1;
    }
    state.lastFoodTime = now;

    // Check for booster pickup
    if (state.food.boosterType) {
      activateBooster(state, state.food.boosterType);
      state.lastEventBooster = true;
    } else {
      // Regular points calculation
      let points = state.food.isBonus ? 10 * state.comboMultiplier : 1 * state.comboMultiplier;
      
      // Apply double points booster
      if (state.booster && state.booster.effect === 'multiplier') {
        points *= state.booster.value;
      }
      
      state.score += points;
      state.stars += Math.floor(points * STARS_PER_POINT);
      
      const newCheckpoint = Math.floor(state.score / 100);
      if (newCheckpoint > state.lastScoreCheckpoint) {
        state.stars += STARS_FOR_MILESTONE * (newCheckpoint - state.lastScoreCheckpoint);
        state.lastScoreCheckpoint = newCheckpoint;
      }
    }
    
    // Speed up (only if no slow motion booster)
    if (state.snake.length % SPEED_INCREASE_FOOD === 0 && (!state.booster || state.booster.effect !== 'speed')) {
      state.speed += 1;
    }
    
    state.food = spawnFood(state.snake, state.iceTiles);
    state.lastEventFood = true;
  } else {
    // Magnet booster - pull food towards snake
    if (state.booster && state.booster.effect === 'magnet') {
      const magnetRange = state.booster.value;
      const dx = head[0] - state.food.x;
      const dy = head[1] - state.food.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      // If food is within magnet range, move it towards snake
      if (dist > 0 && dist <= magnetRange) {
        // Move food one cell closer every few frames
        if (Math.random() > 0.3) {
          const moveX = dx > 0 ? 1 : (dx < 0 ? -1 : 0);
          const moveY = dy > 0 ? 1 : (dy < 0 ? -1 : 0);
          
          // Only move if new position is valid
          const newX = state.food.x + moveX;
          const newY = state.food.y + moveY;
          
          if (newX >= 0 && newX < GRID_SIZE && newY >= 0 && newY < GRID_SIZE) {
            if (!state.snake.some(([sx, sy]) => sx === newX && sy === newY) &&
                !state.iceTiles.some(tile => tile.x === newX && tile.y === newY)) {
              state.food.x = newX;
              state.food.y = newY;
            }
          }
        }
      }
    }
    
    state.snake.pop();
  }
  
  // Ice tile sliding + mark ice for despawn when stepped on
  const steppedIce = state.iceTiles.find(tile => tile.x === head[0] && tile.y === head[1]);
  if (steppedIce) {
    // Continue moving in same direction (slide)
    state.nextDirection = state.direction;
    // mark for despawn (animated removal)
    if (!steppedIce.despawnTime) {
      steppedIce.despawnTime = performance.now();
      state.lastEventIceBreak = true;
      // schedule a respawn for a new ice tile after a short delay (one per destroyed tile)
      try {
        if (!steppedIce.respawnScheduled) {
          steppedIce.respawnScheduled = true;
          state.pendingIceRespawns.push({ when: steppedIce.despawnTime + ICE_RESPAWN_DELAY });
        }
      } catch (e) {}
    }
  }
  // Remove fully despawned ice (after 400ms)
  state.iceTiles = state.iceTiles.filter(tile => !tile.despawnTime || (performance.now() - tile.despawnTime) < 400);
  // Process pending respawns: spawn new ice tiles when their timers expire
  if (Array.isArray(state.pendingIceRespawns) && state.pendingIceRespawns.length) {
    const now = performance.now();
    const due = state.pendingIceRespawns.filter(p => p.when <= now);
    state.pendingIceRespawns = state.pendingIceRespawns.filter(p => p.when > now);
    for (const _p of due) {
      const nt = spawnSingleIceTile(state.snake, state.food, state.iceTiles);
      if (nt) state.iceTiles.push(nt);
    }
  }
  if (state.gameOver) {
    try { localStorage.setItem('snakeplus_stars', String(Math.floor(state.stars))); } catch(e) {}
  }
  
  // Update booster timer
  updateBoosters(state);
  
  return { gameOver: false, isCrash: false };
}

function isOpposite(dir1, dir2) {
  return (
    (dir1 === 'up' && dir2 === 'down') ||
    (dir1 === 'down' && dir2 === 'up') ||
    (dir1 === 'left' && dir2 === 'right') ||
    (dir1 === 'right' && dir2 === 'left')
  );
}

function spawnFood(snake, iceTiles) {
  let x, y;
  const rand = Math.random();
  let isBonus = rand < BONUS_FOOD_CHANCE;
  let boosterType = null;
  
  // Check for booster spawn (8% chance, overrides bonus food)
  if (rand > (1 - BOOSTER_SPAWN_CHANCE)) {
    isBonus = false;
    // Random booster type
    const boosterKeys = Object.keys(BOOSTERS);
    const randomKey = boosterKeys[Math.floor(Math.random() * boosterKeys.length)];
    boosterType = BOOSTERS[randomKey].id;
  }
  
  do {
    x = Math.floor(Math.random() * GRID_SIZE);
    y = Math.floor(Math.random() * GRID_SIZE);
  } while (snake.some(([sx, sy]) => sx === x && sy === y) || iceTiles.some(tile => tile.x === x && tile.y === y));
  
  return { 
    x, 
    y, 
    isBonus, 
    boosterType,
    spawnTime: performance.now() 
  };
}

function spawnIceTiles() {
  const tiles = new Set();
  const count = Math.max(1, Math.floor(GRID_SIZE * GRID_SIZE * ICE_TILE_CHANCE));
  while (tiles.size < count) {
    let x = Math.floor(Math.random() * GRID_SIZE);
    let y = Math.floor(Math.random() * GRID_SIZE);
    tiles.add(`${x},${y}`);
  }
  // Stagger spawn times slightly so tiles animate in over the first second
  const base = performance.now();
  return Array.from(tiles).map((s, i) => {
    const parts = s.split(',');
    return { x: Number(parts[0]), y: Number(parts[1]), spawnTime: base + Math.floor(Math.random() * 800) };
  });
}

function spawnSingleIceTile(snake, food, iceTiles) {
  const maxAttempts = 200;
  for (let i = 0; i < maxAttempts; i++) {
    const x = Math.floor(Math.random() * GRID_SIZE);
    const y = Math.floor(Math.random() * GRID_SIZE);
    const collisionWithSnake = snake.some(([sx, sy]) => sx === x && sy === y);
    const collisionWithFood = food && (food.x === x && food.y === y);
    const collisionWithIce = iceTiles.some(t => t.x === x && t.y === y);
    if (!collisionWithSnake && !collisionWithFood && !collisionWithIce) {
      return { x, y, spawnTime: performance.now() + Math.floor(Math.random() * 600) };
    }
  }
  return null;
}

function buySkinFromCatalog(state, skinColor) {
  const skin = SKINS_CATALOG.find(s => s.color === skinColor);
  if (!skin) return { success: false, message: 'Скин не найден' };
  
  // Classic skin is always free and already unlocked
  if (skin.price === 0) {
    return { success: false, message: 'Этот скин уже разблокирован' };
  }
  
  if (state.unlockedSkins.includes(skinColor)) return { success: false, message: 'Уже куплен' };
  if (state.stars < skin.price) return { success: false, message: 'Недостаточно звёзд' };

  state.stars -= skin.price;
  state.unlockedSkins.push(skinColor);
  try {
    localStorage.setItem('snakeplus_stars', String(Math.floor(state.stars)));
    localStorage.setItem('snakeplus_skins', JSON.stringify(state.unlockedSkins));
    try { window.dispatchEvent(new CustomEvent('skinsUpdated', { detail: { unlocked: state.unlockedSkins } })); } catch(e) {}
  } catch (e) {}
  return { success: true, message: 'Куплено!' };
}

function activateBooster(state, boosterType) {
  // Find booster config
  const boosterConfig = Object.values(BOOSTERS).find(b => b.id === boosterType);
  if (!boosterConfig) return;
  
  // Activate booster
  state.booster = {
    ...boosterConfig,
    startTime: performance.now(),
    endTime: performance.now() + boosterConfig.duration,
  };
  
  // Apply immediate effects
  if (boosterConfig.effect === 'speed') {
    state.speed = state.baseSpeed * boosterConfig.value;
  }
  
  if (boosterConfig.effect === 'shield') {
    state.shieldActive = true;
  }
  
  console.log('Booster activated:', boosterConfig.name);
}

function updateBoosters(state) {
  if (!state.booster) return;
  
  const now = performance.now();
  
  // Check if booster expired
  if (now >= state.booster.endTime) {
    // Reset booster effects
    if (state.booster.effect === 'speed') {
      state.speed = state.baseSpeed;
    }
    if (state.booster.effect === 'shield') {
      state.shieldActive = false;
    }
    state.booster = null;
    console.log('Booster expired');
  }
}

// Achievement functions
function getPlayerStats() {
  const defaultStats = {
    bestScore: 0,
    maxCombo: 0,
    totalGames: 0,
    boostersUsed: [],
    skinsOwned: 0,
    totalStars: 0,
  };

  // Try to get from localStorage first
  try {
    const stored = localStorage.getItem('snakeplus_stats');
    if (stored) {
      const localStats = { ...defaultStats, ...JSON.parse(stored) };
      
      // Try to get from server (for cross-device sync)
      // Only if we have Telegram user
      if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe?.user) {
        import('./api.js').then(({ getPlayerStatsFromServer }) => {
          getPlayerStatsFromServer().then(serverStats => {
            if (serverStats) {
              // Merge server stats (prefer higher values)
              const merged = {
                bestScore: Math.max(localStats.bestScore, serverStats.bestScore || 0),
                maxCombo: Math.max(localStats.maxCombo, serverStats.maxCombo || 0),
                totalGames: localStats.totalGames + (serverStats.totalGames || 0),
                boostersUsed: [...new Set([...localStats.boostersUsed, ...(serverStats.boostersUsed || [])])],
                skinsOwned: Math.max(localStats.skinsOwned, serverStats.skinsOwned || 0),
                totalStars: Math.max(localStats.totalStars, serverStats.totalStars || 0),
              };
              localStorage.setItem('snakeplus_stats', JSON.stringify(merged));
            }
          });
        });
      }
      
      return localStats;
    }
  } catch (e) {}

  return defaultStats;
}

function savePlayerStats(stats) {
  try {
    localStorage.setItem('snakeplus_stats', JSON.stringify(stats));
  } catch (e) {}
}

function getUnlockedAchievements() {
  try {
    const stored = localStorage.getItem('snakeplus_achievements');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {}
  return [];
}

function unlockAchievement(achievementId) {
  const unlocked = getUnlockedAchievements();
  if (!unlocked.includes(achievementId)) {
    unlocked.push(achievementId);
    localStorage.setItem('snakeplus_achievements', JSON.stringify(unlocked));
    
    // Find achievement and give reward
    const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
    if (achievement) {
      // Add stars reward
      const currentStars = localStorage.getItem('snakeplus_stars') || '0';
      localStorage.setItem('snakeplus_stars', String(parseInt(currentStars) + achievement.reward));
      console.log(`🏆 Achievement unlocked: ${achievement.name}! +${achievement.reward} ⭐`);
    }
    
    return true;
  }
  return false;
}

function checkAchievements() {
  const stats = getPlayerStats();
  const unlocked = getUnlockedAchievements();
  const newAchievements = [];
  
  ACHIEVEMENTS.forEach(achievement => {
    if (!unlocked.includes(achievement.id)) {
      if (achievement.condition(stats)) {
        if (unlockAchievement(achievement.id)) {
          newAchievements.push(achievement);
        }
      }
    }
  });
  
  return newAchievements;
}

function updateGameStats(score, combo, boosterUsed) {
  const stats = getPlayerStats();

  // Update best score
  if (score > stats.bestScore) {
    stats.bestScore = score;
  }

  // Update max combo
  if (combo > stats.maxCombo) {
    stats.maxCombo = combo;
  }

  // Track booster usage
  if (boosterUsed && !stats.boostersUsed.includes(boosterUsed)) {
    stats.boostersUsed.push(boosterUsed);
  }

  // Update total games (only once per game session)
  // Check if we already counted this game
  const lastGameTime = localStorage.getItem('snakeplus_last_game_time');
  const now = Date.now();
  if (!lastGameTime || (now - parseInt(lastGameTime)) > 60000) {
    // More than 1 minute since last game - count this one
    stats.totalGames++;
    localStorage.setItem('snakeplus_last_game_time', String(now));
  }

  // Update total score
  stats.totalScore = (stats.totalScore || 0) + score;

  savePlayerStats(stats);
}

function incrementGamesPlayed() {
  const stats = getPlayerStats();
  stats.totalGames++;
  savePlayerStats(stats);
}

function updateSkinsOwned(count) {
  const stats = getPlayerStats();
  stats.skinsOwned = count;
  savePlayerStats(stats);
}

export { getInitialState, updateMechanics, SKINS_CATALOG, buySkinFromCatalog, getRank, RANKS, BOOSTERS, ACHIEVEMENTS, activateBooster, updateBoosters, getPlayerStats, getUnlockedAchievements, checkAchievements, updateGameStats, incrementGamesPlayed, updateSkinsOwned, savePlayerStats };
