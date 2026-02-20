// config.js - Game Configuration
const CONFIG = {
  // Firebase mode (always true now)
  ONLINE_MODE: true,

  // Game settings
  GRID_SIZE: 20,
  BASE_SPEED: 5, // cells/sec
  SPEED_INCREASE_FOOD: 8, // eat 8 foods to speed up (was 5)
  COMBO_WINDOW: 3500, // ms (was 2500, +1 sec)
  BONUS_FOOD_CHANCE: 0.12,
  ICE_TILE_CHANCE: 0.02,
  ICE_RESPAWN_DELAY: 4000,
  ICE_SPEED_MULTIPLIER: 2.0, // 2x speed on ice
  ICE_DURATION: 2000, // 2 seconds ice effect

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
  ICE_SPEED_MULTIPLIER,
  ICE_DURATION,
  STARS_PER_POINT,
  STARS_FOR_MILESTONE,
} = CONFIG;

// Export CONFIG as default
export default CONFIG;
