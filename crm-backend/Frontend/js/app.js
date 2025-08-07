import * as api from './data-manager.js';
import { renderPage, closePopup } from './ui-renderer.js';

let currentPage = 'dashboard';
let currentOptions = {}; // Для хранения ID и другой информации

/**
 * Центральная функция для обновления данных и перерисовки интерфейса.
 */
async function reloadAndRender() {
    await api.loadData();
    renderPage(currentPage, currentOptions);
}

/**
 * Обрабатывает отправку форм СОЗДАНИЯ.
 */
async function handleCreateForm(form) {
    const entityType = form.dataset.entity;
    const formData = Object.fromEntries(new FormData(form));
    
    // Преобразование типов данных
    if(formData.parentId) formData.parentId = formData.parentId ? parseInt(formData.parentId) : null;
    
    try {
        switch (entityType) {
            case 'department':
                await api.createDepartment(formData);
                currentPage = 'departments';
                break;
            case 'client':
                await api.createClient(formData);
                currentPage = 'clients';
                break;
            case 'request':
                // Логика создания нового клиента из формы заявки
                if (formData.clientId === 'new') {
                    const newClient = await api.createClient({
                        companyName: formData.newClientCompanyName,
                        contactPerson: formData.newClientContactPerson,
                        contacts: formData.newClientContacts,
                        status: 'Лид'
                    });
                    formData.clientId = newClient.id;
                }
                // Преобразуем числовые поля
                formData.clientId = parseInt(formData.clientId);
                formData.managerId = parseInt(formData.managerId);
                formData.engineerId = parseInt(formData.engineerId);
                formData.amount = parseFloat(formData.amount);
                
                await api.createRequest(formData);
                currentPage = 'requests';
                break;
        }
        closePopup();
        await reloadAndRender();
    } catch (error) {
        console.error(`Ошибка при создании ${entityType}:`, error);
        alert(`Не удалось создать ${entityType}.`);
    }
}

/**
 * Обрабатывает отправку форм РЕДАКТИРОВАНИЯ.
 */
async function handleEditForm(form) {
    const entityType = form.dataset.entity;
    const formData = Object.fromEntries(new FormData(form));
    const id = parseInt(formData.id);

    try {
        switch (entityType) {
            case 'client':
                await api.updateClient(id, formData);
                break;
            // Добавьте другие кейсы по мере необходимости
        }
        await reloadAndRender();
        alert(`${entityType} успешно обновлен!`);
    } catch (error) {
        console.error(`Ошибка при обновлении ${entityType}:`, error);
        alert(`Не удалось обновить ${entityType}.`);
    }
}


/**
 * Инициализация приложения.
 */
async function init() {
    // Глобальный обработчик отправки форм
    document.addEventListener('submit', (e) => {
        e.preventDefault();
        const form = e.target;
        if (form.dataset.entity && form.dataset.action === 'create') {
            handleCreateForm(form);
        }
        if (form.dataset.entity && form.dataset.action === 'edit') {
            handleEditForm(form);
        }
    });

    // Глобальный обработчик кликов (для навигации и кнопок)
    document.addEventListener('click', (e) => {
        const target = e.target;

        // Навигация
        const navLink = target.closest('a[data-page]');
        if (navLink) {
            e.preventDefault();
            currentPage = navLink.dataset.page;
            currentOptions = {};
            renderPage(currentPage, currentOptions);
        }

        // Кнопки открытия форм создания
        const createBtn = target.closest('button[data-action="create"]');
        if (createBtn) {
            currentPage = `create-${createBtn.dataset.entity}`;
            currentOptions = {};
            renderPage(currentPage);
        }
        
        // Кнопки/ссылки для открытия деталей (редактирования)
        const detailsLink = target.closest('[data-action="details"]');
        if (detailsLink) {
            e.preventDefault();
            currentPage = `${detailsLink.dataset.entity}-details`;
            currentOptions[`${detailsLink.dataset.entity}Id`] = parseInt(detailsLink.dataset.id);
            renderPage(currentPage, currentOptions);
        }
    });

    // Первоначальная загрузка
    currentPage = 'dashboard';
    await reloadAndRender();
}

document.addEventListener('DOMContentLoaded', init);