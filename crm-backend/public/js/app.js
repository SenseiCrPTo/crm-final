import * as api from './data-manager.js';
import { renderPage, initNavigation } from './ui-renderer.js';

// Глобальные переменные для отслеживания текущего состояния
let currentPage = 'dashboard';
let currentContextId = null;

/**
 * Загружает свежие данные с сервера и перерисовывает текущую страницу.
 */
async function reloadAndRender() {
    await api.loadData();
    renderPage(currentPage, currentContextId);
}

/**
 * Обрабатывает отправку любой формы в приложении.
 * @param {Event} event - Событие отправки формы.
 */
async function handleFormSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const action = form.dataset.action;
    const entity = form.dataset.entity;
    const formData = Object.fromEntries(new FormData(form));

    // Преобразуем ID в числа, если они есть
    for (const key in formData) {
        if (key.endsWith('Id') && formData[key]) {
            formData[key] = parseInt(formData[key], 10);
        } else if (formData[key] === '') {
            delete formData[key]; // Удаляем пустые поля, чтобы не отправлять их
        }
    }

    try {
        if (action === 'create') {
            await handleCreate(entity, formData);
        } else if (action === 'edit') {
            await handleEdit(entity, formData);
        }
        
        // После успешного действия перезагружаем данные и рендерим обновленную страницу
        await reloadAndRender();

    } catch (error) {
        console.error(`Ошибка при действии '${action}' для '${entity}':`, error);
        alert('Произошла ошибка. Пожалуйста, проверьте консоль.');
    }
}

/**
 * Обрабатывает создание новых сущностей (клиент, заявка и т.д.).
 * @param {string} entity - Тип сущности.
 * @param {object} formData - Данные из формы.
 */
async function handleCreate(entity, formData) {
    switch (entity) {
        case 'department':
            await api.createDepartment(formData);
            currentPage = 'departments';
            break;
        case 'client':
            await api.createClient(formData);
            currentPage = 'clients';
            break;
        case 'request':
            if (formData.clientId === 'new') {
                const newClient = await api.createClient({
                    companyName: formData.newClientCompanyName,
                    contactPerson: formData.newClientContactPerson,
                    status: 'Лид'
                });
                formData.clientId = newClient.id;
            }
            await api.createRequest(formData);
            currentPage = 'requests';
            break;
        case 'employee':
            await api.createEmployee(formData);
            currentPage = 'departments';
            break;
    }
    currentContextId = null; // Сбрасываем контекст после создания
}

/**
 * Обрабатывает редактирование существующих сущностей.
 * @param {string} entity - Тип сущности.
 * @param {object} formData - Данные из формы.
 */
async function handleEdit(entity, formData) {
    const id = parseInt(formData.id, 10);
    delete formData.id; // Удаляем id из данных для отправки

    switch (entity) {
        case 'client':
            await api.updateClient(id, formData);
            break;
        case 'employee':
            await api.updateEmployee(id, formData);
            break;
        case 'request':
            await api.updateRequest(id, formData);
            break;
    }
}

/**
 * Глобальный обработчик кликов для навигации и действий.
 * @param {Event} event - Событие клика.
 */
function handleGlobalClick(event) {
    const target = event.target;
    // Ищем ближайший родительский элемент, который является ссылкой или кнопкой с data-атрибутом
    const link = target.closest('a[data-page], button[data-action], div[data-action]');

    if (!link) return;

    const { page, action, entity, id } = link.dataset;

    if (page) {
        event.preventDefault();
        currentPage = page;
        currentContextId = null;
        renderPage(currentPage, currentContextId);
    } else if (action) {
        event.preventDefault();
        if (action === 'create') {
            currentPage = `create-${entity}`;
            currentContextId = null;
        } else if (action === 'details') {
            currentPage = `${entity}-details`;
            currentContextId = parseInt(id, 10);
        }
        renderPage(currentPage, currentContextId);
    }
}

/**
 * Инициализация приложения при загрузке страницы.
 */
async function init() {
    // =======================================================
    // ИЗМЕНЕНИЕ ЗДЕСЬ: Делаем функцию доступной глобально
    // =======================================================
    window.reloadAndRender = reloadAndRender;
    
    // 1. Отрисовываем навигацию один раз при старте
    initNavigation();
    
    // 2. Навешиваем обработчики на кнопки мобильного меню
    const menuButton = document.getElementById('menu-button');
    const closeMenuButton = document.getElementById('close-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');

    function toggleMenu() {
        mobileMenu.classList.toggle('hidden');
    }

    menuButton.addEventListener('click', toggleMenu);
    closeMenuButton.addEventListener('click', toggleMenu);
    
    // 3. Добавляем глобальные обработчики
    document.addEventListener('submit', handleFormSubmit);
    document.addEventListener('click', handleGlobalClick);
    
    // 4. Загружаем данные и отрисовываем первую страницу
    await reloadAndRender();
}

// Запускаем инициализацию после полной загрузки DOM
document.addEventListener('DOMContentLoaded', init);