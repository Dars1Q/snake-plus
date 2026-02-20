# 🐍 Snake+ Telegram Mini App

Классическая игра Змейка в Telegram с Firebase базой данных!

## 🎮 Как играть

1. Открой бота в Telegram
2. Нажми **Start** или **/start**
3. Управляй свайпами или стрелками
4. Ешь еду, расти, набирай очки!

## 🏆 Особенности

- ✅ **Глобальный рейтинг** - соревнуйся с другими игроками
- ✅ **Профиль** - твоя статистика и лучшие игры
- ✅ **Магазин** - покупай скины за звёзды
- ✅ **Достижения** - открывай награды
- ✅ **Бустеры** - Slow Motion, Magnet, 2x Points, Shield
- ✅ **Лёд** - скользкие плитки (со стрелочками!)
- ✅ **Комбо** - получай множитель очков
- ✅ **Мультиязычность** - Русский / English

## 🔧 Технологии

- **Frontend**: HTML5, CSS3, JavaScript (ES6 Modules)
- **Database**: Firebase Firestore
- **Hosting**: GitHub Pages
- **Platform**: Telegram WebApp

## 🚀 Установка

### Локальный запуск:

```bash
# Клонировать репозиторий
git clone https://github.com/Dars1Q/snake-plus.git
cd snake-plus

# Установить зависимости
npm install

# Открыть index.html в браузере
```

### Деплой на GitHub Pages:

```bash
git push origin main
```

## ⚙️ Настройка Firebase

1. Создай проект на https://console.firebase.google.com/
2. Включи **Firestore Database** (test mode)
3. Скопируй конфиг из Project Settings
4. Вставь в `index.html` (строка ~20)

## 📊 Структура проекта

```
snake-plus/
├── index.html          # Основная страница + Firebase
├── styles.css          # Стили
├── package.json        # Зависимости
├── src/
│   ├── api.js         # Firebase API
│   ├── audio.js       # Звуки
│   ├── config.js      # Конфигурация
│   ├── controls.js    # Управление
│   ├── gameEngine.js  # Игровой движок
│   ├── mechanics.js   # Игровая механика
│   ├── profile.js     # Профиль
│   ├── renderer.js    # Рендеринг
│   └── ui.js          # UI компоненты
└── .github/
    └── workflows/     # GitHub Actions
```

## 🎮 Управление

- **Свайпы** - на мобильных устройствах
- **Стрелки** / **WASD** - на компьютере
- **Кнопки** - в меню игры

## 🏅 Очки

- 🍎 Обычная еда: +1 очко
- ⭐ Бонусная еда: +10 очков
- 🔥 Комбо: множитель x2, x3, x4...
- 🎁 Бустеры: Slow Motion, Magnet, 2x Points, Shield

## 🌟 Звёзды

- 1 очко = 0.1 звезды
- 100 очков = +10 звёзд (бонус)
- Звёзды тратятся в магазине на скины

## 📱 Telegram Bot

1. Создай бота через @BotFather
2. Включи WebApp в настройках бота
3. Укажи URL: `https://dars1q.github.io/snake-plus/`

## 📝 Лицензия

MIT License

---

**Enjoy the game!** 🎮🐍
