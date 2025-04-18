const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path'); // Не забудьте импортировать path

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Настройка CORS
const corsOptions = {
    origin: 'http://localhost:8888', // URL вашего клиентского приложения
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
};

app.use(cors(corsOptions)); // Включите CORS с заданными опциями

app.use(bodyParser.json());


const clients = {}; // Список активных пользователей
const messages = []; // Хранение сообщений


// API для логина
app.post('/login', (req, res) => {
    const { login } = req.body;

    // Проверяем, существует ли уже логин
    if (clients[login]) {
        return res.json({ status: false, message: 'Псевдоним занят' });
    }
    clients[login] = true; // Добавляем нового клиента
    notifyUsers(); // Уведомляем о новых пользователях
    return res.json({ status: true });
});

// API для проверки состояния сервера
app.get('/check', (req, res) => {
    return res.json({ status: true });
});

// Обработка соединения WebSocket
wss.on('connection', (ws) => {
    let username; // Определяем username здесь

    ws.on('message', (message) => {
        const data = JSON.parse(message);
        if (data.type === 'login') {
            username = data.username; // Сохраняем имя пользователя
            clients[username] = true; // Добавляем клиента к списку
            console.log(`${username} подключен`);
            notifyUsers(); // Уведомляем всех о новом подключении
        }

        // Обработка сообщений
        if (data.type === 'message') {
            const msgData = {
                name: data.username,
                message: data.message,
                type: 'message',
                date: new Date().toLocaleTimeString()
            };
            messages.push(msgData);
            notifyClients(msgData); // Отправляем сообщение всем клиентам
        }
    });

    // Обработка отключения клиента
    ws.on('close', () => {
        if (username) {
            console.log(`${username} отключен`);
            delete clients[username]; // Удаляем пользователя из списка
            notifyUsers(); // Уведомляем об обновленном списке пользователей
        }
    });
});

// Функция для уведомления всех клиентов о новом сообщении
function notifyClients(msgData) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(msgData));
        }
    });
}

// Функция для уведомления всех подключенных пользователей
function notifyUsers() {
    const userData = {
        names: Object.keys(clients),
        type: 'user'
    };

    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(userData));
        }
    });
}

// Запуск сервера
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});