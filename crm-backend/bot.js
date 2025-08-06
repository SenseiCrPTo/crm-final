// Импортируем библиотеку для работы с Telegram
const TelegramBot = require('node-telegram-bot-api');
// Строка 'require(node-fetch)' была здесь и теперь удалена.

// Функция для запуска бота
function startBot() {
    // Получаем токен из переменных окружения
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
        console.error('Ошибка: Токен для Telegram бота не найден! Добавьте TELEGRAM_BOT_TOKEN в переменные окружения.');
        return;
    }

    // URL нашего API, который работает на Railway
    // Убедитесь, что этот URL правильный для вашего проекта
    const API_URL = 'https://crm-final-production.up.railway.app/api';

    const bot = new TelegramBot(token, { polling: true });

    const userSessions = {};

    console.log('Телеграм-бот успешно запущен.');

    bot.onText(/\/start/, (msg) => {
        const chatId = msg.chat.id;
        userSessions[chatId] = { step: 'companyName', clientData: {}, requestData: {} };
        bot.sendMessage(chatId, 'Здравствуйте! Давайте зарегистрируем вас как нового клиента. Введите название вашей компании:');
    });

    bot.on('message', async (msg) => {
        const chatId = msg.chat.id;
        const text = msg.text;

        if (text === '/start') return;

        const session = userSessions[chatId];
        if (!session) {
            bot.sendMessage(chatId, 'Пожалуйста, начните с отправки команды /start');
            return;
        }

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
                session.clientData.status = 'Лид';
                
                bot.sendMessage(chatId, 'Регистрирую клиента...');

                try {
                    const response = await fetch(`${API_URL}/clients`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(session.clientData)
                    });
                    const newClient = await response.json();

                    if (!response.ok) throw new Error(newClient.error || 'Не удалось создать клиента');

                    bot.sendMessage(chatId, `Клиент "${newClient.companyName}" успешно создан!`);
                    
                    session.requestData.clientId = newClient.id;
                    session.requestData.city = newClient.city;
                    session.step = 'address';
                    bot.sendMessage(chatId, 'Теперь давайте создадим заявку. Введите адрес объекта:');

                } catch (error) {
                    console.error('Ошибка при создании клиента:', error);
                    bot.sendMessage(chatId, 'Произошла ошибка при создании клиента. Попробуйте позже.');
                    delete userSessions[chatId];
                }
                break;

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
                session.requestData.status = 'Новая заявка';

                bot.sendMessage(chatId, 'Создаю заявку...');

                try {
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
                    delete userSessions[chatId];
                }
                break;
        }
    });
}

module.exports = { startBot };