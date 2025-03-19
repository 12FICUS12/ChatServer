const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(bodyParser.json());
app.use(cors()); // Позволяет любому источнику делать запросы к вашему серверу
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

wss.on('connection', (ws, req) => {
    const params = new URLSearchParams(req.url.split('?')[1]);
    const username = params.get('login');

    if (username) {
        console.log(`${username} подключен`);
        notifyUsers(); // Уведомляем всех о новом подключении

        // Когда клиент отправляет сообщение
        ws.on('message', (message) => {
            const data = JSON.parse(message);
            if (data.type === 'message') {
                const msgData = {
                    name: username,
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
            console.log(`${username} отключен`);
            delete clients[username]; // Удаляем пользователя из списка
            notifyUsers(); // Уведомляем об обновленном списке пользователей
        });
    }
});

// Функция для уведомления всех клиентов о новом сообщении
function notifyClients(msgData) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(msgData));
        }
    });
}

// Запуск сервера
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});