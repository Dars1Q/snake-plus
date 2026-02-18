// config.js - Game Configuration
const CONFIG = {
  // Set to true to use online backend, false for offline (localStorage)
  ONLINE_MODE: true,

  // API Base URL (used when ONLINE_MODE is true)
  // For Railway: replace with your Railway URL
  API_URL: 'https://your-railway-url.up.railway.app/api',

  // Game settings
  GRID_SIZE: 20,
  BASE_SPEED: 5,
  SPEED_INCREASE_FOOD: 5,
  COMBO_WINDOW: 2500,
  BONUS_FOOD_CHANCE: 0.12,
  ICE_TILE_CHANCE: 0.02,
  ICE_RESPAWN_DELAY: 4000,

  // Economy
  STARS_PER_POINT: 0.1,
  STARS_FOR_MILESTONE: 10,
};

// Export individual values for convenience
export const {
  ONLINE_MODE,
  API_URL,
  GRID_SIZE,
  BASE_SPEED,
  SPEED_INCREASE_FOOD,
  COMBO_WINDOW,
  BONUS_FOOD_CHANCE,
  ICE_TILE_CHANCE,
  ICE_RESPAWN_DELAY,
  STARS_PER_POINT,
  STARS_FOR_MILESTONE,
} = CONFIG;

// Export CONFIG as default
export default CONFIG;
