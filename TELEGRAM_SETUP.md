# 🤖 Telegram Bot Setup Guide

## 1. Создание бота

### В @BotFather:

1. Откройте Telegram и найдите [@BotFather](https://t.me/botfather)
2. Отправьте команду `/newbot`
3. Введите имя бота (например: `Snake+ Game`)
4. Введите username бота (должен заканчиваться на `bot`, например: `SnakePlusGameBot`)
5. Сохраните полученный **API Token**

```
BotFather: Use this token to access the HTTP API:
1234567890:ABCdefGHIjklMNOpqrsTUVwxyz123456
```

## 2. Настройка WebApp

### В @BotFather:

1. Отправьте `/mybots`
2. Выберите вашего бота
3. Нажмите `Bot Settings` → `Menu Button` → `Configure Menu Button`
4. Отправьте URL вашего приложения:
   - Для тестов: `https://your-username.github.io/SnakePlus/`
   - Или ваш сервер: `https://yourdomain.com/`
5. Введите название кнопки (например: `🎮 Играть`)

### Альтернативно - прямая ссылка:

```
https://t.me/YourBotName?startapp=snake
```

## 3. Настройка сервера

### Обновите server/.env:

```env
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz123456
PORT=3000
NODE_ENV=production
```

## 4. Деплой на хостинг

### Варианты:

**Vercel/Netlify** (бесплатно):
```bash
npm install -g vercel
vercel deploy
```

**Heroku**:
```bash
heroku create snake-plus
git push heroku main
```

**VPS** (DigitalOcean, Hetzner):
```bash
# Установка Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Клонирование и запуск
git clone <your-repo>
cd SnakePlus/server
npm install
npm start

# PM2 для работы в фоне
npm install -g pm2
pm2 start server.js --name snake-plus
pm2 startup
pm2 save
```

## 5. Проверка

1. Откройте бота в Telegram
2. Нажмите кнопку меню
3. Игра должна загрузиться

## 6. Дополнительная настройка

### Inline кнопка:

Отправьте @BotFather:
```
/setinline
Выберите бота
Введите URL: https://yourdomain.com/
```

### Deep links:

```
https://t.me/YourBot?start=ref123
```

---

## 🎨 Кастомизация

### Цвета темы:

Игра автоматически подстраивается под тему Telegram:
- Тёмная тема → тёмный фон
- Светлая тема → светлый фон

### Название в WebApp:

В @BotFather:
```
/setname
Выберите бота
Введите: Snake+ Game
```

---

## ✅ Чеклист

- [ ] Бот создан
- [ ] Token сохранён в .env
- [ ] WebApp URL настроен
- [ ] Сервер развёрнут
- [ ] Игра открывается в Telegram
