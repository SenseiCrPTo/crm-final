// js/pages/layout.js

const mobileNavLinksContainer = document.getElementById('mobile-nav-links');
const desktopNavLinksContainer = document.getElementById('desktop-nav-links');
const headerButtonsContainer = document.getElementById('header-buttons'); // Предполагается, что такой id есть в шапке для кнопок

const navLinksData = [
    { page: 'dashboard', text: 'Главная', icon: 'dashboard' },
    { page: 'requests', text: 'Заявки', icon: 'list_alt' },
    { page: 'clients', text: 'Клиенты', icon: 'people' },
    { page: 'departments', text: 'Отделы', icon: 'business_center' },
    { page: 'documents', text: 'Документы', icon: 'folder' },
];

/**
 * Генерирует HTML для навигационных ссылок.
 * @param {Array} linksData - Массив объектов с данными о ссылках.
 * @returns {string} - HTML-строка.
 */
function generateNavLinks(linksData) {
    return linksData.map(link => `
        <a href="#" 
           class="nav-item flex items-center px-4 py-2.5 text-sm font-medium rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white"
           data-page="${link.page}">
            <span class="material-icons mr-3">${link.icon}</span>
            ${link.text}
        </a>
    `).join('');
}

/**
 * Инициализирует и отрисовывает оба навигационных меню (мобильное и десктопное).
 */
export function initNavigation() {
    const navHtml = generateNavLinks(navLinksData);
    if (mobileNavLinksContainer) {
        mobileNavLinksContainer.innerHTML = navHtml;
    }
    if (desktopNavLinksContainer) {
        desktopNavLinksContainer.innerHTML = navHtml;
    }
}

/**
 * Обновляет активное состояние ссылок в обоих меню.
 * @param {string} pageId - ID текущей активной страницы.
 */
export function updateActiveNav(pageId) {
    document.querySelectorAll('.nav-item').forEach(link => {
        const isActive = link.dataset.page === pageId || (pageId.includes(link.dataset.page) && link.dataset.page !== 'dashboard');
        link.classList.toggle('active', isActive);
    });
}

/**
 * Отрисовывает кнопки в шапке в зависимости от страницы.
 * @param {string} pageId - ID текущей страницы.
 */
export function renderHeaderButtons(pageId) {
    if (!headerButtonsContainer) return;
    
    let buttonsHtml = '';
    switch (pageId) {
        case 'clients':
            buttonsHtml = `<button class="primary-btn" data-action="create" data-entity="client">Добавить клиента</button>`;
            break;
        case 'departments':
            buttonsHtml = `
                <button class="primary-btn" data-action="create" data-entity="department">Добавить отдел</button>
                <button class="primary-btn" data-action="create" data-entity="employee">Добавить сотрудника</button>
            `;
            break;
        case 'requests':
             buttonsHtml = `<button class="primary-btn" data-action="create" data-entity="request">Создать заявку</button>`;
            break;
    }
    headerButtonsContainer.innerHTML = buttonsHtml;
}