# Snake+ Backend Server

Backend server for Snake+ Telegram Mini App game.

## Features

- 📊 Save and retrieve scores
- 🏆 Global leaderboard
- 🎨 Skin purchase system
- ⭐ User stars/currency management
- 🔐 Telegram WebApp authentication support

## Installation

```bash
npm install
```

## Configuration

Copy `.env` file and configure:

```env
PORT=3000
NODE_ENV=development
TELEGRAM_BOT_TOKEN=your_bot_token_here
DATABASE_PATH=./database.db
```

## Usage

```bash
# Development mode
npm run dev

# Production mode
npm start
```

## API Endpoints

### Health Check
```
GET /api/health
```

### Scores
```
POST /api/score
Body: { userId, username, score, rank, language }

GET /api/leaderboard?limit=50

GET /api/user/:userId/best

GET /api/user/:userId/scores?limit=10
```

### Skins
```
POST /api/skin/buy
Body: { userId, skinColor, skinName, price }

GET /api/user/:userId/skins
```

### Stars
```
POST /api/user/:userId/stars
Body: { stars, totalStars }
```

### User Data
```
GET /api/user/:userId
```

### Global Rank
```
GET /api/rank/:score
```

## Database Schema

- `users` - User information from Telegram
- `scores` - All game scores
- `user_skins` - Purchased skins per user
- `user_stars` - User currency balance
- `global_stats` - Global game statistics

## Online/Offline Mode

The frontend can work in two modes (configured in `src/config.js`):

- **OFFLINE_MODE: false** - Uses localStorage (no server required)
- **ONLINE_MODE: true** - Uses backend API (server required)

## License

MIT
