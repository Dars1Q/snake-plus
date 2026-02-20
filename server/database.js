// database.js - SQLite Database Configuration (using sql.js)
const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, 'database.db');

let db = null;

// Auto-save interval (ms)
const AUTO_SAVE_INTERVAL = 5000;

// Initialize database
async function initDatabase() {
  console.log('📦 Initializing database...');
  
  const SQL = await initSqlJs();
  
  // Load existing database or create new one
  try {
    if (fs.existsSync(DB_PATH)) {
      const fileBuffer = fs.readFileSync(DB_PATH);
      db = new SQL.Database(fileBuffer);
      console.log('📁 Database loaded from:', DB_PATH);
    } else {
      db = new SQL.Database();
      console.log('📁 New database created:', DB_PATH);
    }
  } catch (error) {
    console.error('Error loading database:', error);
    db = new SQL.Database();
  }

  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      user_id TEXT PRIMARY KEY,
      username TEXT,
      first_name TEXT,
      last_name TEXT,
      language_code TEXT DEFAULT 'en',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      username TEXT,
      telegram_user TEXT,
      score INTEGER NOT NULL,
      rank TEXT DEFAULT 'Bronze I',
      language TEXT DEFAULT 'en',
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`CREATE INDEX IF NOT EXISTS idx_scores_score ON scores(score DESC)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_scores_user ON scores(user_id)`);

  db.run(`
    CREATE TABLE IF NOT EXISTS user_skins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      skin_color TEXT NOT NULL,
      skin_name TEXT,
      price INTEGER DEFAULT 0,
      acquired_at TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, skin_color)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS user_stars (
      user_id TEXT PRIMARY KEY,
      stars INTEGER DEFAULT 0,
      total_stars INTEGER DEFAULT 0,
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS user_stats (
      user_id TEXT PRIMARY KEY,
      best_score INTEGER DEFAULT 0,
      max_combo INTEGER DEFAULT 0,
      total_games INTEGER DEFAULT 0,
      boosters_used TEXT DEFAULT '[]',
      skins_owned INTEGER DEFAULT 0,
      total_stars INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS global_stats (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      total_games INTEGER DEFAULT 0,
      total_scores INTEGER DEFAULT 0,
      highest_score INTEGER DEFAULT 0,
      highest_score_user TEXT,
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Insert initial stats row
  db.run(`
    INSERT OR IGNORE INTO global_stats (id, total_games, total_scores, highest_score)
    VALUES (1, 0, 0, 0)
  `);

  // Auto-save
  setInterval(saveDatabase, AUTO_SAVE_INTERVAL);
  
  // Save on exit
  process.on('SIGINT', () => {
    saveDatabase();
    db.close();
    process.exit(0);
  });

  console.log('✅ Database initialized successfully');
}

// Save database to file
function saveDatabase() {
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
    console.log('💾 Database saved');
  } catch (error) {
    console.error('Error saving database:', error);
  }
}

// Helper function to update global stats
function updateGlobalStats(score, userId) {
  try {
    db.run(`
      UPDATE global_stats 
      SET total_games = total_games + 1,
          total_scores = total_scores + 1,
          updated_at = datetime('now')
      WHERE id = 1
    `);

    const stmt = db.prepare('SELECT highest_score, highest_score_user FROM global_stats WHERE id = 1');
    if (stmt.step()) {
      const current = stmt.getAsObject();
      stmt.free();
      
      if (score > current.highest_score) {
        db.run(`
          UPDATE global_stats 
          SET highest_score = ?,
              highest_score_user = ?,
              updated_at = datetime('now')
          WHERE id = 1
        `, [score, userId]);
      }
    }
  } catch (error) {
    console.error('Error updating global stats:', error);
  }
}

// Helper to get object from result
function getStatementObject(stmt) {
  const row = stmt.getAsObject();
  return row;
}

module.exports = {
  getDb: () => db,
  initDatabase,
  saveDatabase,
  updateGlobalStats
};
