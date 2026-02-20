// config.js - Game Configuration
const CONFIG = {
  // Firebase mode (always true now)
  ONLINE_MODE: true,

  // Game settings
  GRID_SIZE: 20,
  BASE_SPEED: 5, // cells/sec
  SPEED_INCREASE_FOOD: 5,
  COMBO_WINDOW: 2500, // ms
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
