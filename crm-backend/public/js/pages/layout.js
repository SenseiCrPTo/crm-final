// public/js/pages/layout.js

const mobileNavLinksContainer = document.getElementById('mobile-nav-links');
const desktopNavLinksContainer = document.getElementById('desktop-nav-links');

const navLinksData = [
    { page: 'dashboard', text: 'Главная', icon: 'dashboard' },
    { page: 'requests', text: 'Заявки', icon: 'list_alt' },
    { page: 'clients', text: 'Клиенты', icon: 'people' },
    { page: 'departments', text: 'Отделы', icon: 'business_center' },
    { page: 'documents', text: 'Документы', icon: 'folder' },
];

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

export function initNavigation() {
    const navHtml = generateNavLinks(navLinksData);
    if (mobileNavLinksContainer) {
        mobileNavLinksContainer.innerHTML = navHtml;
    }
    if (desktopNavLinksContainer) {
        desktopNavLinksContainer.innerHTML = navHtml;
    }
}

export function updateActiveNav(pageId) {
    document.querySelectorAll('.nav-item').forEach(link => {
        // Определяем "группу" страницы (например, для 'client-details' группой будет 'clients')
        const pageGroup = pageId.split('-')[0];
        const isActive = link.dataset.page === pageGroup;
        link.classList.toggle('active', isActive);
    });
}

export function renderHeaderButtons(pageId) {
    const headerButtonsContainer = document.getElementById('header-buttons');
    if (!headerButtonsContainer) return;
    
    // Общие стили для кнопок
    const btnClasses = "px-3 py-1.5 text-sm font-semibold text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-800 whitespace-nowrap";
    
    let buttonsHtml = '';
    switch (pageId) {
        case 'clients':
            buttonsHtml = `<button class="${btnClasses}" data-action="create" data-entity="client">Добавить клиента</button>`;
            break;
        case 'departments':
            buttonsHtml = `
                <button class="${btnClasses}" data-action="create" data-entity="department">Добавить отдел</button>
                <button class="${btnClasses} ml-2" data-action="create" data-entity="employee">Добавить сотрудника</button>
            `;
            break;
        case 'requests':
             buttonsHtml = `<button class="${btnClasses}" data-action="create" data-entity="request">Создать заявку</button>`;
            break;
        default:
            buttonsHtml = ''; // На других страницах кнопок нет
    }
    headerButtonsContainer.innerHTML = buttonsHtml;
}