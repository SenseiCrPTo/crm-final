/**
 * ui-renderer.js
 * * Этот модуль больше не содержит HTML-код страниц.
 * Его новая роль - быть "маршрутизатором" рендеринга.
 * Он импортирует функции отрисовки из папки /pages и вызывает нужную
 * в зависимости от текущей страницы (pageId).
 */

// Импортируем наш менеджер данных, чтобы передавать данные в функции рендера
import { data } from './data-manager.js';

// Импортируем функции для управления общим каркасом приложения (меню, шапка)
import { initNavigation, updateActiveNav, renderHeaderButtons } from './pages/layout.js';

// Импортируем все наши новые модули страниц
import { renderDashboard } from './pages/dashboard.js';
import { renderRequestsPage, renderEditRequestPage, renderCreateRequestPage } from './pages/requests.js';
import { renderClientListPage, renderClientDetailsPage, renderCreateClientPage } from './pages/clients.js';
import { renderEmployeeListPage, renderEmployeeDetailsPage, renderCreateDepartmentPage, renderCreateEmployeePage } from './pages/employees.js';
import { renderDocuments } from './pages/documents.js';


// --- Основные DOM-элементы ---
const pageContainer = document.getElementById('page-content-container');
const pageTitle = document.getElementById('page-title');
const mobileMenu = document.getElementById('mobile-menu');

/**
 * Главная функция отрисовки. Работает как диспетчер.
 * @param {string} pageId - Идентификатор страницы для отрисовки.
 * @param {number|null} contextId - Дополнительный ID (например, ID клиента или заявки).
 */
export function renderPage(pageId, contextId = null) {
    // 1. Очищаем предыдущий контент
    pageContainer.innerHTML = '';
    pageContainer.className = 'main-content min-h-screen space-y-4'; // Сбрасываем классы на дефолтные
    
    // 2. Закрываем мобильное меню при навигации
    if (mobileMenu) {
        mobileMenu.classList.add('hidden');
    }

    let title = 'Главная';

    // 3. Вызываем нужную функцию рендеринга в зависимости от pageId
    switch (pageId) {
        case 'dashboard':
            title = 'Главная';
            renderDashboard(pageContainer, data);
            break;
        case 'requests':
            title = 'Заявки';
            renderRequestsPage(pageContainer, data);
            break;
        case 'create-request':
            title = 'Создание новой заявки';
            renderCreateRequestPage(pageContainer, data);
            break;
        case 'edit-request':
            // Заголовок устанавливается внутри самой функции
            renderEditRequestPage(pageContainer, contextId, data);
            break;
        case 'clients':
            title = 'Клиенты';
            renderClientListPage(pageContainer, data);
            break;
        case 'create-client':
            title = 'Новый клиент';
            renderCreateClientPage(pageContainer, data);
            break;
        case 'client-details':
            // Заголовок устанавливается внутри самой функции
            renderClientDetailsPage(pageContainer, contextId, data);
            break;
        case 'departments':
            title = 'Отделы и сотрудники';
            renderEmployeeListPage(pageContainer, data);
            break;
        case 'create-department':
            title = 'Создание отдела';
            renderCreateDepartmentPage(pageContainer, data);
            break;
        case 'create-employee':
            title = 'Добавление сотрудника';
            renderCreateEmployeePage(pageContainer, data);
            break;
        case 'employee-details':
            // Заголовок устанавливается внутри самой функции
            renderEmployeeDetailsPage(pageContainer, contextId, data);
            break;
        case 'documents':
            title = 'Документы';
            renderDocuments(pageContainer);
            break;
        default:
            pageId = 'dashboard';
            title = 'Главная';
            renderDashboard(pageContainer, data);
    }
    
    // 4. Обновляем элементы общего каркаса (заголовок, кнопки, активное меню)
    if (pageTitle && !['client-details', 'edit-request', 'employee-details'].includes(pageId)) {
        pageTitle.textContent = title;
    }
    
    updateActiveNav(pageId);
    renderHeaderButtons(pageId);
}

// Экспортируем функцию инициализации навигации, чтобы ее можно было вызвать один раз в app.js
export { initNavigation };