// renderer.js
// Handles all Canvas drawing with enhanced particle effects
import { BOOSTERS } from './mechanics.js';

let ctx, canvas;
// particles for despawning ice tiles, keyed by "x,y"
const tileParticles = new Map();
// particles for snake crash
let crashParticles = [];
// particles for food glow
const foodParticles = [];
// particles for snake trail
const trailParticles = [];
// particles for combo effect
const comboParticles = [];

// Particle types
const PARTICLE_TYPES = {
  SPARK: { size: 0.15, decay: 0.95, gravity: 0 },
  SMOKE: { size: 0.3, decay: 0.92, gravity: -0.5 },
  STAR: { size: 0.2, decay: 0.9, gravity: 0.2 },
  GLOW: { size: 0.4, decay: 0.88, gravity: 0 },
};

export function spawnCrashParticles(x, y, gridSize) {
  if (!canvas) return;
  const cellSize = (canvas.width / (window.devicePixelRatio || 1)) / (gridSize || 20);
  const centerX = x * cellSize + cellSize / 2;
  const centerY = y * cellSize + cellSize / 2;
  
  // Main explosion
  for (let i = 0; i < 30; i++) {
    const ang = Math.random() * Math.PI * 2;
    const speed = 80 + Math.random() * 250;
    const vx = Math.cos(ang) * speed;
    const vy = Math.sin(ang) * speed;
    const ttl = 400 + Math.random() * 500;
    const colors = ['#ff5722', '#ff9800', '#ffeb3b', '#ff0000'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    crashParticles.push({
      x: centerX,
      y: centerY,
      vx,
      vy,
      ttl,
      birth: performance.now(),
      color,
      size: cellSize * 0.25,
      type: 'spark',
    });
  }
  
  // Smoke effect
  for (let i = 0; i < 15; i++) {
    const ang = Math.random() * Math.PI * 2;
    const speed = 30 + Math.random() * 80;
    const vx = Math.cos(ang) * speed;
    const vy = Math.sin(ang) * speed - 50;
    const ttl = 600 + Math.random() * 400;
    crashParticles.push({
      x: centerX,
      y: centerY,
      vx,
      vy,
      ttl,
      birth: performance.now(),
      color: 'rgba(100, 100, 100, 0.5)',
      size: cellSize * 0.4,
      type: 'smoke',
    });
  }
}

export function spawnFoodParticles(x, y, gridSize, isBonus = false) {
  if (!canvas) return;
  const cellSize = (canvas.width / (window.devicePixelRatio || 1)) / (gridSize || 20);
  const centerX = x * cellSize + cellSize / 2;
  const centerY = y * cellSize + cellSize / 2;
  
  const colors = isBonus 
    ? ['#ffd700', '#ffeb3b', '#fff176', '#ffffff']
    : ['#e74c3c', '#ff6b6b', '#ff8a8a', '#ffffff'];
  
  // Smaller, subtler particles
  for (let i = 0; i < 6; i++) {
    const ang = Math.random() * Math.PI * 2;
    const speed = 20 + Math.random() * 40;
    const vx = Math.cos(ang) * speed;
    const vy = Math.sin(ang) * speed;
    const ttl = 200 + Math.random() * 150;
    foodParticles.push({
      x: centerX,
      y: centerY,
      vx,
      vy,
      ttl,
      birth: performance.now(),
      color: colors[Math.floor(Math.random() * colors.length)],
      size: cellSize * 0.08,
      type: 'spark',
    });
  }
}

export function spawnTrailParticles(x, y, gridSize, color) {
  if (!canvas) return;
  const cellSize = (canvas.width / (window.devicePixelRatio || 1)) / (gridSize || 20);
  const centerX = x * cellSize + cellSize / 2;
  const centerY = y * cellSize + cellSize / 2;
  
  trailParticles.push({
    x: centerX,
    y: centerY,
    alpha: 0.6,
    birth: performance.now(),
    ttl: 200,
    color: color,
    size: cellSize * 0.3,
  });
}

export function spawnComboParticles(x, y, gridSize, multiplier) {
  if (!canvas) return;
  const cellSize = (canvas.width / (window.devicePixelRatio || 1)) / (gridSize || 20);
  const centerX = x * cellSize + cellSize / 2;
  const centerY = y * cellSize + cellSize / 2;
  
  const colors = ['#ffe066', '#ffd700', '#ffeb3b', '#ffffff'];
  
  for (let i = 0; i < multiplier * 3; i++) {
    const ang = Math.random() * Math.PI * 2;
    const speed = 50 + Math.random() * 150;
    const vx = Math.cos(ang) * speed;
    const vy = Math.sin(ang) * speed;
    const ttl = 400 + Math.random() * 300;
    comboParticles.push({
      x: centerX,
      y: centerY,
      vx,
      vy,
      ttl,
      birth: performance.now(),
      color: colors[Math.floor(Math.random() * colors.length)],
      size: cellSize * 0.2,
      type: 'star',
    });
  }
}

export function spawnBoosterParticles(x, y, gridSize, boosters) {
  if (!canvas) return;
  const cellSize = (canvas.width / (window.devicePixelRatio || 1)) / (gridSize || 20);
  const centerX = x * cellSize + cellSize / 2;
  const centerY = y * cellSize + cellSize / 2;
  
  // Rainbow colored particles for boosters
  const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
  
  for (let i = 0; i < 20; i++) {
    const ang = Math.random() * Math.PI * 2;
    const speed = 60 + Math.random() * 120;
    const vx = Math.cos(ang) * speed;
    const vy = Math.sin(ang) * speed;
    const ttl = 500 + Math.random() * 300;
    foodParticles.push({
      x: centerX,
      y: centerY,
      vx,
      vy,
      ttl,
      birth: performance.now(),
      color: colors[Math.floor(Math.random() * colors.length)],
      size: cellSize * 0.12,
      type: 'spark',
    });
  }
}

export function initRenderer() {
  canvas = document.getElementById('game-canvas');
  ctx = canvas.getContext('2d');
  // Use explicit width/height attributes for canvas
  const width = canvas.width || 400;
  const height = canvas.height || 400;
  // High DPI support
  const dpr = window.devicePixelRatio || 1;
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);
}

function easeOut(t) {
  return 1 - Math.pow(1 - t, 3);
}

export function renderGame(state) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const now = performance.now();
  try {
    // Draw grid
    const cellSize = (canvas.width / (window.devicePixelRatio || 1)) / state.gridSize;
    // Draw ice tiles: stable ones below the snake, despawning ones above the snake so fade is visible
    const iceTiles = Array.isArray(state.iceTiles) ? state.iceTiles : (state.iceTiles ? Object.values(state.iceTiles) : []);
    const stableIce = iceTiles.filter(t => !t.despawnTime);
    const despawningIce = iceTiles.filter(t => t.despawnTime);
    const drawTile = (tile) => {
      const spawnDur = 300;
      const despawnDur = 400;
      const age = Math.max(0, now - (tile.spawnTime || 0));
      const tin = Math.min(1, age / spawnDur);
      const ain = easeOut(tin);
      let a = ain * 0.95;
      let scale = 0.6 + 0.4 * ain;
      // If tile is despawning, factor out fade/scale
      if (tile.despawnTime) {
        const ageOut = Math.max(0, now - tile.despawnTime);
        const tout = Math.min(1, ageOut / despawnDur);
        const aout = easeOut(tout);
        // reduce alpha and shrink
        a = a * (1 - aout);
        scale = scale * (1 - 0.3 * aout);
        // If fully despawned, skip drawing (mechanics will remove soon)
        if (tout >= 1) return;
      }
      const x = tile.x * cellSize;
      const y = tile.y * cellSize;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.translate(x + cellSize / 2, y + cellSize / 2);
      ctx.scale(scale, scale);
      
      // Ice tile background
      ctx.fillStyle = '#7fdfff';
      ctx.fillRect(-cellSize / 2, -cellSize / 2, cellSize, cellSize);
      
      // Ice shine effect
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fillRect(-cellSize / 2, -cellSize / 2, cellSize / 2, cellSize / 2);
      
      // Direction arrows (show which way snake will slide)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = `${cellSize * 0.4}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('➤', 0, 0);
      
      ctx.restore();
      // when tile starts despawning, create spark particles once
      if (tile.despawnTime) {
        const key = tile.x + ',' + tile.y;
        if (!tileParticles.has(key)) {
          const parts = [];
          const n = 14;
          const birth = tile.despawnTime || performance.now();
          for (let i = 0; i < n; i++) {
            const ang = Math.random() * Math.PI * 2;
            const speed = 40 + Math.random() * 120; // px/sec
            const vx = Math.cos(ang) * speed;
            const vy = Math.sin(ang) * speed;
            const ttl = 400 + Math.random() * 300;
            const color = Math.random() > 0.6 ? '#ffffff' : '#bfefff';
            parts.push({ vx, vy, ttl, birth, color });
          }
          tileParticles.set(key, { parts, cx: x + cellSize / 2, cy: y + cellSize / 2 });
        }
      }
    };
    stableIce.forEach(drawTile);
    // Draw snake
    ctx.fillStyle = state.snakeColor;
    (Array.isArray(state.snake) ? state.snake : []).forEach(([x, y]) => {
      ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
    });
    // Draw despawning ice on top so the fade/shrink is visible when stepped on
    despawningIce.forEach(drawTile);
    
    // Draw snake with trail effect
    const snakeArray = Array.isArray(state.snake) ? state.snake : [];
    
    // Spawn trail particles for each segment (more frequently)
    if (snakeArray.length > 0) {
      snakeArray.forEach((segment, index) => {
        // More particles for longer snakes, but skip head
        if (index > 0 && Math.random() > 0.5) {
          const [x, y] = segment;
          spawnTrailParticles(x, y, state.gridSize, state.snakeColor);
        }
      });
    }
    
    // Draw trail particles FIRST (so they appear behind the snake)
    for (let i = trailParticles.length - 1; i >= 0; i--) {
      const p = trailParticles[i];
      const age = now - p.birth;
      const prog = Math.min(1, age / p.ttl);
      if (prog < 1) {
        const alpha = p.alpha * (1 - prog) * 0.5;
        const size = p.size * (1 + prog * 0.3);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else {
        trailParticles.splice(i, 1);
      }
    }
    
    ctx.fillStyle = state.snakeColor;
    snakeArray.forEach(([x, y]) => {
      ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
    });
    
    // Render and update any active particles for despawned tiles
    tileParticles.forEach((entry, key) => {
      const parts = entry.parts;
      let remaining = 0;
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        const age = now - p.birth;
        const prog = Math.min(1, age / p.ttl);
        if (prog < 1) {
          remaining++;
          const dx = p.vx * (age / 1000);
          const dy = p.vy * (age / 1000);
          const px = entry.cx + dx;
          const py = entry.cy + dy;
          const alpha = 1 - prog;
          const size = Math.max(1, (cellSize * 0.18) * (1 - prog));
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.fillStyle = p.color;
          ctx.fillRect(px - size / 2, py - size / 2, size, size);
          ctx.restore();
        }
      }
      if (remaining === 0) tileParticles.delete(key);
    });
    // Render crash particles (red/orange explosion)
    crashParticles = crashParticles.filter(p => {
      const age = now - p.birth;
      const prog = Math.min(1, age / p.ttl);
      if (prog < 1) {
        const dx = p.vx * (age / 1000);
        const dy = p.vy * (age / 1000);
        const px = p.x + dx;
        const py = p.y + dy;
        const alpha = 1 - prog;
        const size = Math.max(1, cellSize * 0.25 * (1 - prog));
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.fillRect(px - size / 2, py - size / 2, size, size);
        ctx.restore();
        return true;
      }
      return false;
    });
    // Draw food with pop animation and particles
    if (state.food) {
      const age = Math.max(0, now - (state.food.spawnTime || 0));
      const dur = 300;
      const t = Math.min(1, age / dur);
      const a = easeOut(t);
      const scale = 0.5 + 0.5 * a;
      const fx = state.food.x * cellSize;
      const fy = state.food.y * cellSize;
      
      // Spawn food glow particles (less frequently)
      if (Math.random() > 0.7) {
        spawnFoodParticles(state.food.x, state.food.y, state.gridSize, state.food.isBonus);
      }
      
      ctx.save();
      ctx.globalAlpha = 0.85 + 0.15 * a;
      ctx.translate(fx + cellSize / 2, fy + cellSize / 2);
      ctx.scale(scale, scale);
      
      // Glow effect
      ctx.shadowBlur = 10;
      
      // Check if booster
      if (state.food.boosterType) {
        const booster = Object.values(BOOSTERS).find(b => b.id === state.food.boosterType);
        if (booster) {
          ctx.shadowColor = booster.color;
          ctx.fillStyle = booster.color;
          // Draw booster as circle with icon
          const boosterSize = cellSize * 0.85;
          ctx.beginPath();
          ctx.arc(0, 0, boosterSize / 2, 0, Math.PI * 2);
          ctx.fill();
          // Draw icon
          ctx.fillStyle = '#ffffff';
          ctx.font = `${cellSize * 0.5}px Arial`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.shadowBlur = 0;
          ctx.fillText(booster.icon, 0, 2);
        }
      } else {
        ctx.shadowColor = state.food.isBonus ? '#ffd700' : '#e74c3c';
        ctx.fillStyle = state.food.isBonus ? '#ffd700' : '#e74c3c';
        
        // Draw smaller food (80% of cell size)
        const foodSize = cellSize * 0.8;
        ctx.fillRect(-foodSize / 2, -foodSize / 2, foodSize, foodSize);
      }
      ctx.restore();
    }
    
    // Render food particles
    for (let i = foodParticles.length - 1; i >= 0; i--) {
      const p = foodParticles[i];
      const age = now - p.birth;
      const prog = Math.min(1, age / p.ttl);
      if (prog < 1) {
        const dx = p.vx * (age / 1000);
        const dy = p.vy * (age / 1000);
        const alpha = 1 - prog;
        const size = p.size * (1 - prog * 0.5);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x + dx, p.y + dy, size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else {
        foodParticles.splice(i, 1);
      }
    }
    
    // Render combo particles
    for (let i = comboParticles.length - 1; i >= 0; i--) {
      const p = comboParticles[i];
      const age = now - p.birth;
      const prog = Math.min(1, age / p.ttl);
      if (prog < 1) {
        const dx = p.vx * (age / 1000);
        const dy = p.vy * (age / 1000);
        const alpha = 1 - prog;
        const size = p.size * (1 - prog * 0.3);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x + dx, p.y + dy, size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else {
        comboParticles.splice(i, 1);
      }
    }
    
    // Draw HUD text
    ctx.fillStyle = '#fff';
    ctx.font = '18px Arial';
    ctx.fillText('Score: ' + (state.score || 0), 10, 24);
    if (state.comboMultiplier > 1) {
      ctx.fillStyle = '#ffe066';
      ctx.fillText('Combo x' + state.comboMultiplier, 10, 48);
    }
  } catch (err) {
    console.error('renderGame error', err);
  }
}
