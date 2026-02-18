// database.js - PostgreSQL Database Configuration
const { Pool } = require('pg');

// Connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Initialize database tables
async function initDatabase() {
  console.log('📦 Initializing PostgreSQL database...');

  try {
    const client = await pool.connect();
    
    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        user_id TEXT PRIMARY KEY,
        username TEXT,
        telegram_user JSONB,
        first_name TEXT,
        last_name TEXT,
        language_code TEXT DEFAULT 'en',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Table: users');

    // Create scores table
    await client.query(`
      CREATE TABLE IF NOT EXISTS scores (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(user_id),
        username TEXT,
        telegram_user JSONB,
        score INTEGER NOT NULL,
        rank TEXT DEFAULT 'Bronze I',
        language TEXT DEFAULT 'en',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Table: scores');

    // Create index for leaderboard
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_scores_score ON scores(score DESC)
    `);
    console.log('✅ Index: idx_scores_score');

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_scores_user ON scores(user_id)
    `);
    console.log('✅ Index: idx_scores_user');

    // Create user_skins table
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_skins (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(user_id),
        skin_color TEXT NOT NULL,
        skin_name TEXT,
        price INTEGER DEFAULT 0,
        acquired_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, skin_color)
      )
    `);
    console.log('✅ Table: user_skins');

    // Create user_stars table
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_stars (
        user_id TEXT PRIMARY KEY REFERENCES users(user_id),
        stars INTEGER DEFAULT 0,
        total_stars INTEGER DEFAULT 0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Table: user_stars');

    // Create global_stats table
    await client.query(`
      CREATE TABLE IF NOT EXISTS global_stats (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        total_games INTEGER DEFAULT 0,
        total_scores INTEGER DEFAULT 0,
        highest_score INTEGER DEFAULT 0,
        highest_score_user TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Table: global_stats');

    // Insert initial stats row
    await client.query(`
      INSERT INTO global_stats (id, total_games, total_scores, highest_score)
      VALUES (1, 0, 0, 0)
      ON CONFLICT (id) DO NOTHING
    `);

    client.release();
    console.log('🎉 Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    throw error;
  }
}

// Helper function to get database pool
function getPool() {
  return pool;
}

// Update global stats
async function updateGlobalStats(score, userId) {
  try {
    const client = await pool.connect();
    
    // Increment total games and scores
    await client.query(`
      UPDATE global_stats 
      SET total_games = total_games + 1,
          total_scores = total_scores + 1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `);

    // Update highest score if needed
    const result = await client.query(`
      SELECT highest_score, highest_score_user FROM global_stats WHERE id = 1
    `);
    
    if (result.rows[0] && score > result.rows[0].highest_score) {
      await client.query(`
        UPDATE global_stats 
        SET highest_score = $1,
            highest_score_user = $2,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = 1
      `, [score, userId]);
    }

    client.release();
  } catch (error) {
    console.error('Error updating global stats:', error);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down database connection...');
  await pool.end();
  process.exit(0);
});

module.exports = {
  pool,
  getPool,
  initDatabase,
  updateGlobalStats
};
