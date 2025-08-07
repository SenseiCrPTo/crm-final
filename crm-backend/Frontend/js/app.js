import * as api from './js/data-manager.js';
import { renderPage, closePopup } from './js/ui-renderer.js';

let currentPage = 'dashboard';
let currentOptions = {};

/**
 * Центральная функция для обновления данных и перерисовки интерфейса.
 */
async function reloadAndRender() {
    try {
        await api.loadData();
        renderPage(currentPage, currentOptions);
    } catch (error) {
        console.error("Не удалось перезагрузить и отобразить данные:", error);
    }
}

/**
 * Обрабатывает отправку всех форм (создания и редактирования).
 */
async function handleFormSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const action = form.dataset.action;
    const entity = form.dataset.entity;
    const formData = Object.fromEntries(new FormData(form));

    // Преобразуем строковые ID в числа
    for (const key in formData) {
        if (key.endsWith('Id') && formData[key]) {
            formData[key] = parseInt(formData[key], 10);
        }
    }

    try {
        if (action === 'create') {
            await handleCreate(entity, formData);
        } else if (action === 'edit') {
            await handleEdit(entity, formData);
        }
        
        closePopup();
        await reloadAndRender();

    } catch (error) {
        console.error(`Ошибка при действии '${action}' для '${entity}':`, error);
        alert('Произошла ошибка. Пожалуйста, проверьте консоль.');
    }
}

/**
 * Маршрутизирует запросы на СОЗДАНИЕ.
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
                    contacts: formData.newClientContacts,
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
}

/**
 * Маршрутизирует запросы на РЕДАКТИРОВАНИЕ.
 */
async function handleEdit(entity, formData) {
    const id = parseInt(formData.id);
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
 * Обрабатывает все клики на странице для навигации и кнопок.
 */
function handleGlobalClick(event) {
    const target = event.target;
    const link = target.closest('a, button'); // Ищем ближайшую ссылку или кнопку

    if (!link || !link.dataset.action) {
        // Если это клик по навигации в sidebar
        const navLink = target.closest('a[data-page]');
        if (navLink) {
            event.preventDefault();
            currentPage = navLink.dataset.page;
            currentOptions = {};
            renderPage(currentPage, currentOptions);
        }
        return;
    }

    event.preventDefault();
    const { action, entity, id } = link.dataset;

    if (action === 'create') {
        currentPage = `create-${entity}`;
        currentOptions = {};
        renderPage(currentPage);
    } else if (action === 'details') {
        currentPage = `${entity}-details`;
        currentOptions = { [`${entity}Id`]: parseInt(id) };
        renderPage(currentPage, currentOptions);
    }
}

/**
 * Инициализация приложения.
 */
async function init() {
    // Назначаем глобальные функции, которые можно вызывать из HTML (для Sortable.js и т.д.)
    window.updateRequestStatus = async (requestId, newStatus) => {
        try {
            await api.updateRequest(requestId, { status: newStatus });
            await reloadAndRender();
        } catch (error) {
            console.error("Не удалось обновить статус заявки:", error);
        }
    };
    
    // Устанавливаем единые обработчики на весь документ
    document.addEventListener('submit', handleFormSubmit);
    document.addEventListener('click', handleGlobalClick);
    
    // Первоначальная загрузка данных и отрисовка главной страницы
    await reloadAndRender();
}

document.addEventListener('DOMContentLoaded', init);