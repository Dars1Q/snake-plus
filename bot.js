// bot.js - Telegram Bot для обработки inline-запросов
const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN не найден в .env файле!');
  console.error('Создайте файл .env и добавьте ваш токен бота');
  process.exit(1);
}

const bot = new TelegramBot(TOKEN, { polling: true });

// Получаем имя бота из токена (для логирования)
const botUsername = TOKEN.split(':')[0];
console.log('🤖 Бот запущен (ID:', botUsername + ')');

// ============================================
// Inline Mode Handler
// ============================================

bot.on('inline_query', (query) => {
  const queryText = query.query || '';
  
  // Формируем сообщение с результатом игры
  const results = [
    {
      type: 'article',
      id: 'share_score',
      title: '🐍 Поделиться результатом',
      description: 'Поделитесь своим счётом в Snake+ с друзьями!',
      input_message_content: {
        message_text: `🐍 Snake+\n\n🏆 Score: ${queryText || '0'}\n🏅 Rank: Player\n\nCan you beat my score? 🎮\n#SnakePlus`,
        parse_mode: 'Markdown'
      },
      url: 'https://t.me/myRetroGameBot',
      hide_url: true,
      thumbnail_url: 'https://cdn-icons-png.flaticon.com/512/5260/5260094.png',
      thumbnail_width: 256,
      thumbnail_height: 256
    },
    {
      type: 'article',
      id: 'invite_play',
      title: '🎮 Пригласить друзей',
      description: 'Пригласите друзей сыграть в Snake+!',
      input_message_content: {
        message_text: `🐍 *Давайте сыграем в Snake+!*\n\nОтличная аркадная игра в Telegram.\n\nИграйте прямо сейчас: @myRetroGameBot`,
        parse_mode: 'Markdown'
      },
      url: 'https://t.me/myRetroGameBot',
      hide_url: true,
      thumbnail_url: 'https://cdn-icons-png.flaticon.com/512/5260/5260094.png',
      thumbnail_width: 256,
      thumbnail_height: 256
    }
  ];

  bot.answerInlineQuery(query.id, results, {
    cache_time: 300,
    is_personal: false
  });
});

// ============================================
// Обработка выбранного inline-сообщения
// ============================================

bot.on('chosen_inline_result', (result) => {
  console.log('✅ User selected inline result:', result.result_id, 'by user', result.from.id);
});

// ============================================
// Команда /start
// ============================================

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  
  bot.sendMessage(chatId, '🐍 *Добро пожаловать в Snake+!*\n\nНажмите кнопку ниже, чтобы начать игру.', {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: '🎮 Играть',
            web_app: { url: 'https://your-game-url.com' } // Замените на ваш URL игры
          }
        ]
      ]
    },
    parse_mode: 'Markdown'
  });
});

// ============================================
// Обработка ошибок
// ============================================

bot.on('error', (err) => {
  console.error('❌ Ошибка бота:', err.message);
});

// ============================================
// Graceful shutdown
// ============================================

process.on('SIGINT', () => {
  console.log('\n🛑 Остановка бота...');
  bot.stopPolling();
  process.exit(0);
});

console.log('✅ Бот готов к обработке inline-запросов!');
console.log('   Для проверки введите: @myRetroGameBot <ваш счёт>');
