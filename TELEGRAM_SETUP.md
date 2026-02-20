# 🤖 Telegram Bot Setup Guide

## 1. Создание бота

### В @BotFather:

1. Открой Telegram и найди [@BotFather](https://t.me/botfather)
2. Отправь команду `/newbot`
3. Введи имя бота (например: `Snake+ Game`)
4. Введи username бота (должен заканчиваться на `bot`, например: `SnakePlusGameBot`)
5. Сохрани полученный **API Token**

```
BotFather: Use this token to access the HTTP API:
1234567890:ABCdefGHIjklMNOpqrsTUVwxyz123456
```

## 2. Настройка WebApp

### В @BotFather:

1. Отправь `/mybots`
2. Выбери своего бота
3. Нажми `Bot Settings` → `Menu Button` → `Configure Menu Button`
4. Отправь URL приложения:
   - GitHub Pages: `https://dars1q.github.io/snake-plus/`
5. Введи название кнопки (например: `🎮 Играть`)

### Альтернативно - прямая ссылка:

```
https://t.me/YourBotName?startapp=snake
```

## 3. Настройка Firebase

### Создай проект:

1. Открой https://console.firebase.google.com/
2. **Add project** → Snake+
3. Продолжи без Google Analytics
4. **Create project**

### Включи Firestore:

1. **Build** → **Firestore Database**
2. **Create database**
3. Выбери **Start in test mode**
4. Выбери локацию (например `us-central`)
5. **Enable**

### Получи конфиг:

1. **Project Overview** → шестерёнка → **Project settings**
2. Scroll to **Your apps** → Click **</>** (Web icon)
3. Register app: Snake+ Web
4. Скопируй `firebaseConfig`

### Вставь конфиг в index.html:

Открой `index.html` (строка ~20) и замени:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

## 4. Деплой на GitHub Pages

### Push кода:

```bash
git add -A
git commit -m "Deploy to GitHub Pages"
git push origin main
```

### GitHub Pages включится автоматически:

1. Открой **Settings** → **Pages**
2. **Source**: Deploy from a branch
3. **Branch**: main → **/(root)**
4. **Save**

Через 1-2 минуты сайт будет доступен по:
```
https://your-username.github.io/snake-plus/
```

## 5. Проверка

1. Открой бота в Telegram
2. Нажми кнопку меню
3. Игра должна загрузиться
4. Сыграй и проверь рейтинг!

---

## 🎨 Кастомизация

### Название бота:

В @BotFather:
```
/setname
Выбери бота
Введи: Snake+ Game
```

### Описание бота:

В @BotFather:
```
/setdescription
Выбери бота
Введи описание
```

### About:

В @BotFather:
```
/setabouttext
Выбери бота
Введи: 🐍 Snake+ - Classic game with global leaderboard!
```

---

## ✅ Чеклист

- [ ] Бот создан
- [ ] WebApp URL настроен
- [ ] Firebase проект создан
- [ ] Firestore включён
- [ ] Конфиг вставлен в index.html
- [ ] Код запушен на GitHub
- [ ] GitHub Pages включён
- [ ] Игра открывается в Telegram

---

## 🔥 Firebase Console

### Проверка данных:

1. Открой https://console.firebase.google.com/project/YOUR_PROJECT/firestore
2. Коллекция `scores` должна содержать записи игроков
3. Каждая запись: userId, username, score, rank, createdAt

### Правила безопасности (позже):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /scores/{document} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

---

**Enjoy!** 🎮🐍
