// server.js - Snake+ Backend Server
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const path = require('path');
const { initDatabase, getPool, updateGlobalStats } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../')));

// Initialize database
initDatabase().catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});

// ============================================
// API Endpoints
// ============================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Save score
app.post('/api/score', async (req, res) => {
  try {
    const { userId, username, score, rank, language, telegramUser } = req.body;

    if (!userId || score === undefined) {
      return res.status(400).json({ error: 'userId and score are required' });
    }

    const pool = getPool();
    
    // Convert telegramUser object to JSON string for PostgreSQL
    const telegramUserJson = telegramUser ? JSON.stringify(telegramUser) : null;
    
    // Insert or update user
    await pool.query(`
      INSERT INTO users (user_id, username, telegram_user, first_name, last_name, language_code, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id) DO UPDATE SET
        username = EXCLUDED.username,
        telegram_user = EXCLUDED.telegram_user,
        updated_at = CURRENT_TIMESTAMP
    `, [
      userId,
      username || 'Anonymous',
      telegramUserJson,
      telegramUser?.first_name || null,
      telegramUser?.last_name || null,
      telegramUser?.language_code || language || 'en'
    ]);

    // Insert score
    await pool.query(`
      INSERT INTO scores (user_id, username, telegram_user, score, rank, language, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
    `, [userId, username || 'Anonymous', telegramUserJson, score, rank || 'Bronze I', language || 'en']);

    // Update global stats
    updateGlobalStats(score, userId);

    res.json({
      success: true,
      message: 'Score saved successfully'
    });
  } catch (error) {
    console.error('Save score error:', error);
    res.status(500).json({ error: 'Failed to save score: ' + error.message });
  }
});

// Get leaderboard (global top scores - unique users with best scores)
app.get('/api/leaderboard', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const pool = getPool();

    // Get unique users with their best scores
    const result = await pool.query(`
      SELECT DISTINCT ON (s1.user_id)
        s1.user_id,
        s1.username,
        s1.telegram_user,
        s1.score,
        s1.rank,
        s1.language,
        s1.created_at
      FROM scores s1
      INNER JOIN (
        SELECT user_id, MAX(score) as max_score
        FROM scores
        GROUP BY user_id
      ) s2 ON s1.user_id = s2.user_id AND s1.score = s2.max_score
      ORDER BY s1.user_id, s1.score DESC
      ORDER BY s1.score DESC
      LIMIT $1
    `, [limit]);

    res.json({
      success: true,
      leaderboard: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ error: 'Failed to get leaderboard: ' + error.message });
  }
});

// Get user's best score
app.get('/api/user/:userId/best', (req, res) => {
  try {
    const { userId } = req.params;
    const db = getDb();
    
    const stmt = db.prepare(`
      SELECT user_id, username, MAX(score) as best_score, rank, language, created_at
      FROM scores
      WHERE user_id = ?
      GROUP BY user_id
    `);
    stmt.bind([userId]);
    
    let bestScore = null;
    if (stmt.step()) {
      bestScore = stmt.getAsObject();
    }
    stmt.free();
    
    if (!bestScore) {
      return res.json({ success: true, bestScore: null, message: 'No scores found' });
    }
    
    res.json({ success: true, bestScore });
  } catch (error) {
    console.error('Get user best score error:', error);
    res.status(500).json({ error: 'Failed to get user score' });
  }
});

// Get user's all scores
app.get('/api/user/:userId/scores', (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    const db = getDb();
    
    const stmt = db.prepare(`
      SELECT user_id, username, score, rank, language, created_at
      FROM scores
      WHERE user_id = ?
      ORDER BY score DESC
      LIMIT ?
    `);
    stmt.bind([userId, limit]);
    
    const scores = [];
    while (stmt.step()) {
      scores.push(stmt.getAsObject());
    }
    stmt.free();
    
    res.json({ success: true, scores });
  } catch (error) {
    console.error('Get user scores error:', error);
    res.status(500).json({ error: 'Failed to get user scores' });
  }
});

// Buy skin
app.post('/api/skin/buy', (req, res) => {
  try {
    const { userId, skinColor, skinName, price } = req.body;
    
    if (!userId || !skinColor) {
      return res.status(400).json({ error: 'userId and skinColor are required' });
    }
    
    const db = getDb();
    
    // Check if already owned
    const checkStmt = db.prepare(`
      SELECT * FROM user_skins WHERE user_id = ? AND skin_color = ?
    `);
    checkStmt.bind([userId, skinColor]);
    let existing = null;
    if (checkStmt.step()) {
      existing = checkStmt.getAsObject();
    }
    checkStmt.free();
    
    if (existing) {
      return res.status(400).json({ error: 'Skin already owned', alreadyOwned: true });
    }
    
    // Add skin to user's collection
    db.run(`
      INSERT INTO user_skins (user_id, skin_color, skin_name, price, acquired_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `, [userId, skinColor, skinName || 'Unknown', price || 0]);
    
    res.json({ 
      success: true, 
      message: 'Skin purchased successfully'
    });
  } catch (error) {
    console.error('Buy skin error:', error);
    res.status(500).json({ error: 'Failed to purchase skin' });
  }
});

// Get user's skins
app.get('/api/user/:userId/skins', (req, res) => {
  try {
    const { userId } = req.params;
    const db = getDb();
    
    const stmt = db.prepare(`
      SELECT skin_color, skin_name, price, acquired_at
      FROM user_skins
      WHERE user_id = ?
      ORDER BY acquired_at DESC
    `);
    stmt.bind([userId]);
    
    const skins = [];
    while (stmt.step()) {
      skins.push(stmt.getAsObject());
    }
    stmt.free();
    
    res.json({ success: true, skins });
  } catch (error) {
    console.error('Get user skins error:', error);
    res.status(500).json({ error: 'Failed to get user skins' });
  }
});

// Update user stars
app.post('/api/user/:userId/stars', (req, res) => {
  try {
    const { userId } = req.params;
    const { stars, totalStars } = req.body;
    
    if (!userId || stars === undefined) {
      return res.status(400).json({ error: 'userId and stars are required' });
    }
    
    const db = getDb();
    
    // Check if exists
    const checkStmt = db.prepare(`SELECT * FROM user_stars WHERE user_id = ?`);
    checkStmt.bind([userId]);
    let exists = checkStmt.step();
    checkStmt.free();
    
    if (exists) {
      db.run(`
        UPDATE user_stars 
        SET stars = ?, total_stars = ?, updated_at = datetime('now')
        WHERE user_id = ?
      `, [stars, totalStars || stars, userId]);
    } else {
      db.run(`
        INSERT INTO user_stars (user_id, stars, total_stars, updated_at)
        VALUES (?, ?, ?, datetime('now'))
      `, [userId, stars, totalStars || stars, userId]);
    }
    
    res.json({ success: true, message: 'Stars updated successfully' });
  } catch (error) {
    console.error('Update stars error:', error);
    res.status(500).json({ error: 'Failed to update stars' });
  }
});

// Get user data (stars, skins, best score)
app.get('/api/user/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const db = getDb();
    
    // Get stars
    const starsStmt = db.prepare(`
      SELECT stars, total_stars, updated_at
      FROM user_stars
      WHERE user_id = ?
    `);
    starsStmt.bind([userId]);
    let stars = null;
    if (starsStmt.step()) {
      stars = starsStmt.getAsObject();
    }
    starsStmt.free();
    
    // Get skins
    const skinsStmt = db.prepare(`
      SELECT skin_color, skin_name, price
      FROM user_skins
      WHERE user_id = ?
    `);
    skinsStmt.bind([userId]);
    const skins = [];
    while (skinsStmt.step()) {
      skins.push(skinsStmt.getAsObject());
    }
    skinsStmt.free();
    
    // Get best score
    const scoreStmt = db.prepare(`
      SELECT MAX(score) as best_score, rank
      FROM scores
      WHERE user_id = ?
    `);
    scoreStmt.bind([userId]);
    let bestScore = null;
    if (scoreStmt.step()) {
      bestScore = scoreStmt.getAsObject();
    }
    scoreStmt.free();
    
    res.json({
      success: true,
      user: {
        userId,
        stars: stars ? stars.stars : 0,
        totalStars: stars ? stars.total_stars : 0,
        skins: skins.map(s => s.skin_color),
        bestScore: bestScore ? bestScore.best_score : 0,
        rank: bestScore ? bestScore.rank : 'Bronze I'
      }
    });
  } catch (error) {
    console.error('Get user data error:', error);
    res.status(500).json({ error: 'Failed to get user data' });
  }
});

// Get user rank by score
app.get('/api/rank/:score', (req, res) => {
  try {
    const { score } = req.params;
    const scoreNum = parseInt(score);
    const db = getDb();
    
    // Count how many players have higher scores
    const stmt = db.prepare(`
      SELECT COUNT(DISTINCT user_id) as rank
      FROM (
        SELECT user_id, MAX(score) as max_score
        FROM scores
        GROUP BY user_id
      )
      WHERE max_score > ?
    `);
    stmt.bind([scoreNum]);
    
    let result = { rank: 0 };
    if (stmt.step()) {
      result = stmt.getAsObject();
    }
    stmt.free();
    
    const userRank = (result.rank || 0) + 1;
    
    // Get total players
    const totalStmt = db.prepare(`
      SELECT COUNT(DISTINCT user_id) as total
      FROM scores
    `);
    totalStmt.bind([]);
    let total = 0;
    if (totalStmt.step()) {
      total = totalStmt.getAsObject().total;
    }
    totalStmt.free();
    
    res.json({
      success: true,
      rank: userRank,
      total,
      percentile: total > 0 ? ((total - userRank) / total * 100).toFixed(2) : 0
    });
  } catch (error) {
    console.error('Get rank error:', error);
    res.status(500).json({ error: 'Failed to get rank' });
  }
});

// ============================================
// Telegram WebApp Auth (optional)
// ============================================

// Verify Telegram WebApp data
function verifyTelegramData(data) {
  const hash = data.hash;
  const dataCheckArr = [];
  
  for (const key in data) {
    if (key !== 'hash') {
      dataCheckArr.push(`${key}=${data[key]}`);
    }
  }
  
  dataCheckArr.sort();
  const dataCheckString = dataCheckArr.join('\n');
  
  const secretKey = crypto.createHmac('sha256', 'WebAppData')
    .update(process.env.TELEGRAM_BOT_TOKEN)
    .digest();
  
  const calculatedHash = crypto.createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');
  
  return calculatedHash === hash;
}

// Auth middleware (optional - for production)
function telegramAuth(req, res, next) {
  if (process.env.NODE_ENV === 'development') {
    return next();
  }
  
  const tgData = req.headers['x-telegram-data'];
  if (!tgData) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    const data = JSON.parse(tgData);
    if (!verifyTelegramData(data)) {
      return res.status(401).json({ error: 'Invalid Telegram data' });
    }
    req.user = data;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid auth data' });
  }
}

// ============================================
// Start Server
// ============================================

app.listen(PORT, () => {
  console.log(`🐍 Snake+ Server running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  const { saveDatabase } = require('./database');
  saveDatabase();
  process.exit(0);
});

module.exports = app;
