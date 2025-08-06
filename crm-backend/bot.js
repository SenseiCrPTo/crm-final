// Импортируем библиотеку для работы с Telegram
const TelegramBot = require('node-telegram-bot-api');
// Импортируем библиотеку для отправки запросов на наш же сервер
const fetch = require('node-fetch');

// Функция для запуска бота
function startBot() {
    // Получаем токен из переменных окружения
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
        console.error('Ошибка: Токен для Telegram бота не найден! Добавьте TELEGRAM_BOT_TOKEN в переменные окружения.');
        return;
    }

    // URL нашего API, который работает на Railway
    const API_URL = 'https://cooperative-amazement-production.up.railway.app/api';

    const bot = new TelegramBot(token, { polling: true });

    // Хранилище для данных, которые мы собираем от пользователя
    // Ключ - это ID чата, значение - объект с данными
    const userSessions = {};

    console.log('Телеграм-бот успешно запущен.');

    // Обработчик команды /start
    bot.onText(/\/start/, (msg) => {
        const chatId = msg.chat.id;
        // Начинаем новую сессию для пользователя
        userSessions[chatId] = { step: 'companyName', clientData: {}, requestData: {} };
        bot.sendMessage(chatId, 'Здравствуйте! Давайте зарегистрируем вас как нового клиента. Введите название вашей компании:');
    });

    // Обработчик всех текстовых сообщений
    bot.on('message', async (msg) => {
        const chatId = msg.chat.id;
        const text = msg.text;

        // Игнорируем команду /start, так как у нее свой обработчик
        if (text === '/start') return;

        const session = userSessions[chatId];
        // Если сессии нет, просим пользователя начать с команды /start
        if (!session) {
            bot.sendMessage(chatId, 'Пожалуйста, начните с отправки команды /start');
            return;
        }

        // Машина состояний: в зависимости от текущего шага, выполняем разные действия
        switch (session.step) {
            case 'companyName':
                session.clientData.companyName = text;
                session.step = 'fullName';
                bot.sendMessage(chatId, 'Отлично! Теперь введите ваше ФИО (полностью):');
                break;

            case 'fullName':
                session.clientData.contactPerson = text;
                session.step = 'contacts';
                bot.sendMessage(chatId, 'Принято. Укажите ваши контакты (телефон, email):');
                break;

            case 'contacts':
                session.clientData.contacts = text;
                session.step = 'region';
                bot.sendMessage(chatId, 'Спасибо. Укажите ваш регион:');
                break;

            case 'region':
                session.clientData.region = text;
                session.step = 'city';
                bot.sendMessage(chatId, 'И последний шаг для регистрации клиента - ваш город:');
                break;

            case 'city':
                session.clientData.city = text;
                session.clientData.status = 'Лид'; // Присваиваем статус "Лид"
                
                bot.sendMessage(chatId, 'Регистрирую клиента...');

                try {
                    // Отправляем запрос на наш API для создания клиента
                    const response = await fetch(`${API_URL}/clients`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(session.clientData)
                    });
                    const newClient = await response.json();

                    if (!response.ok) throw new Error(newClient.error || 'Не удалось создать клиента');

                    bot.sendMessage(chatId, `Клиент "${newClient.companyName}" успешно создан!`);
                    
                    // Сохраняем ID нового клиента и переходим к созданию заявки
                    session.requestData.clientId = newClient.id;
                    session.requestData.city = newClient.city; // Автоматически подставляем город
                    session.step = 'address';
                    bot.sendMessage(chatId, 'Теперь давайте создадим заявку. Введите адрес объекта:');

                } catch (error) {
                    console.error('Ошибка при создании клиента:', error);
                    bot.sendMessage(chatId, 'Произошла ошибка при создании клиента. Попробуйте позже.');
                    delete userSessions[chatId]; // Сбрасываем сессию
                }
                break;

            // --- Шаги для создания заявки ---
            case 'address':
                session.requestData.address = text;
                session.step = 'deadline';
                bot.sendMessage(chatId, 'Адрес принят. Укажите желаемый срок выполнения (например, "до 25.12.2025"):');
                break;
            
            case 'deadline':
                session.requestData.deadline = text;
                session.step = 'info';
                bot.sendMessage(chatId, 'Отлично. Напишите дополнительную информацию по заявке:');
                break;

            case 'info':
                session.requestData.info = text;
                session.requestData.status = 'Новая заявка'; // Статус для новой заявки

                bot.sendMessage(chatId, 'Создаю заявку...');

                try {
                    // Отправляем запрос на API для создания заявки
                     const response = await fetch(`${API_URL}/requests`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(session.requestData)
                    });
                    const newRequest = await response.json();

                    if (!response.ok) throw new Error(newRequest.error || 'Не удалось создать заявку');

                    bot.sendMessage(chatId, `Отлично! Ваша заявка №${newRequest.id} успешно создана и передана в работу.`);
                
                } catch (error) {
                    console.error('Ошибка при создании заявки:', error);
                    bot.sendMessage(chatId, 'Произошла ошибка при создании заявки. Попробуйте позже.');
                } finally {
                    delete userSessions[chatId]; // Завершаем и сбрасываем сессию
                }
                break;
        }
    });
}

// Экспортируем функцию, чтобы ее можно было вызвать из server.js
module.exports = { startBot };