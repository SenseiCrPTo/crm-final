import { data } from './data-manager.js';

const pageContainer = document.getElementById('page-content-container');
const pageTitle = document.getElementById('page-title');
const mobileNavLinks = document.getElementById('mobile-nav-links');
const headerButtonsContainer = document.getElementById('header-buttons');

// Генерируем навигационные ссылки для мобильного меню
const navLinks = [
    { page: 'dashboard', text: 'Главная' },
    { page: 'requests', text: 'Заявки' },
    { page: 'clients', text: 'Клиенты' },
    { page: 'departments', text: 'Отделы' },
    { page: 'documents', text: 'Документы' },
];
mobileNavLinks.innerHTML = navLinks.map(link => 
    `<a href="#" class="text-white text-lg font-medium nav-item" data-page="${link.page}">${link.text}</a>`
).join('');


export function renderPage(pageId, contextId = null) {
    pageContainer.innerHTML = '';
    headerButtonsContainer.innerHTML = '';
    pageContainer.className = '';
    let title = 'Главная';

    // Закрываем мобильное меню при навигации
    document.getElementById('mobile-menu').classList.add('hidden');

    switch (pageId) {
        case 'dashboard':
            title = 'Главная';
            renderDashboard(pageContainer); // Новая функция
            break;
        case 'requests':
            title = 'Заявки';
            renderRequestsPage(pageContainer); // Новая функция
            break;
        case 'clients':
            title = 'Клиенты';
            renderClientListPage(pageContainer); // Новая функция
            break;

        // --- ВСЕ ОСТАЛЬНЫЕ ФУНКЦИИ ИЗ ТВОЕГО ОРИГИНАЛЬНОГО ФАЙЛА ---
        case 'create-request':
            title = 'Создание новой заявки';
            renderCreateRequestPage(pageContainer);
            break;
        case 'edit-request':
            renderEditRequestPage(pageContainer, contextId);
            break;
        case 'create-client':
            title = 'Новый клиент';
            renderCreateClientPage(pageContainer);
            break;
        case 'client-details':
            renderClientDetailsPage(pageContainer, contextId);
            break;
        case 'departments':
            title = 'Отделы и сотрудники';
            renderEmployeeListPage(pageContainer);
            break;
        case 'employee-details':
            renderEmployeeDetailsPage(pageContainer, contextId);
            break;
        case 'create-department':
            title = 'Создание отдела';
            renderCreateDepartmentPage(pageContainer);
            break;
        case 'create-employee':
            title = 'Добавление сотрудника';
            renderCreateEmployeePage(pageContainer);
            break;
        case 'documents':
            renderDocuments(pageContainer);
            break;
        default:
            pageId = 'dashboard';
            title = 'Главная';
            renderDashboard(pageContainer);
    }
    
    if (pageId !== 'client-details' && pageId !== 'edit-request' && pageId !== 'employee-details') {
        pageTitle.textContent = title;
    }
    updateActiveNav(pageId);
}

function updateActiveNav(pageId) {
    mobileNavLinks.querySelectorAll('.nav-item').forEach(link => {
        link.classList.toggle('text-red-500', link.dataset.page === pageId);
    });
}

// ============== НОВЫЕ ФУНКЦИИ РЕНДЕРИНГА С TAILWIND CSS ==============

function renderDashboard(container) {
    const deals = data.requests.filter(r => r.status !== 'Сделка проиграна');
    const totalAmount = deals.reduce((sum, deal) => sum + (Number(deal.amount) || 0), 0);
    const totalCost = deals.reduce((sum, deal) => sum + (Number(deal.cost) || 0), 0);
    const totalProfit = totalAmount - totalCost;
    const clientCount = data.clients.length;
    const currentUser = data.employees[0] || { name: 'тест мен' };
    const myActiveRequests = data.requests.slice(0, 3);

    container.innerHTML = `
        <div class="bg-gray-800 rounded-2xl p-6 shadow-lg">
            <h2 class="text-xl font-bold text-gray-100 mb-4">Доход</h2>
            <div class="flex justify-between items-start">
                <div>
                    <p class="text-3xl font-bold text-red-500">${totalAmount.toLocaleString()} ₸</p>
                    <p class="text-sm text-gray-400 mt-1">Сумма сделок</p>
                </div>
                <div class="text-right">
                    <p class="text-3xl font-bold text-gray-100">${totalProfit.toLocaleString()} ₸</p>
                    <p class="text-sm text-gray-400 mt-1">Прибыль</p>
                </div>
            </div>
        </div>
        <div class="bg-gray-800 rounded-2xl p-6 shadow-lg">
            <h2 class="text-xl font-bold text-gray-100 mb-4">Клиенты</h2>
            <div class="flex justify-between items-start">
                <div>
                    <p class="text-3xl font-bold text-gray-100">${clientCount}</p>
                    <p class="text-sm text-gray-400 mt-1">Всего клиентов</p>
                </div>
                <div class="text-right">
                    <p class="text-3xl font-bold text-orange-500">90%</p>
                    <p class="text-sm text-gray-400 mt-1">Конверсия (пример)</p>
                </div>
            </div>
        </div>
        <div class="bg-gray-800 rounded-2xl p-6 shadow-lg">
            <h2 class="text-xl font-bold text-gray-100 mb-4">Мои активные заявки (${currentUser.name})</h2>
            <div class="space-y-4">
                ${myActiveRequests.map(req => {
                    const client = data.clients.find(c => c.id === req.clientId) || {};
                    return `
                        <div>
                            <h3 class="text-lg font-semibold text-gray-100">Заявка #${req.id}</h3>
                            <p class="text-sm text-gray-400 mt-1">${client.companyName || 'Клиент'} · ${req.status}</p>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}

function renderClientListPage(container) {
     if (!data.clients || data.clients.length === 0) {
        container.innerHTML = '<p class="text-gray-400">Клиенты не найдены.</p>';
        return;
    }
    const clientCards = data.clients.map(client => `
        <div class="bg-gray-800 rounded-2xl p-4 shadow-lg cursor-pointer" onclick="window.openClientDetails(${client.id})">
            <div class="flex justify-between items-center">
                <h3 class="font-bold text-lg text-gray-100">${client.companyName}</h3>
                <span class="text-xs font-medium text-gray-100 bg-gray-700 px-2 py-1 rounded-full">${client.status}</span>
            </div>
            <p class="text-sm text-gray-400 mt-2">${client.contactPerson || 'Контакт не указан'}</p>
        </div>
    `).join('');
    container.innerHTML = clientCards;
}

function renderRequestsPage(container) {
    container.className = 'flex overflow-x-auto space-x-4 pb-4'; 
    
    data.cgmStages.forEach(stageName => {
        const column = document.createElement('div');
        column.className = 'flex-shrink-0 w-80 bg-gray-900 rounded-xl p-4';
        
        const requestsForStage = data.requests.filter(req => req.status === stageName);
        
        let cardsHtml = requestsForStage.map(req => {
            const client = data.clients.find(c => c.id === req.clientId) || {};
            return `
                <div class="bg-gray-800 rounded-lg p-4 mt-4 cursor-pointer" onclick="window.openRequestDetails(${req.id})">
                    <h4 class="font-semibold text-gray-100">${client.companyName || 'Неизвестный клиент'}</h4>
                    <p class="text-sm text-gray-400 mt-1">${Number(req.amount).toLocaleString()} ₸</p>
                </div>
            `;
        }).join('');

        if (requestsForStage.length === 0) {
            cardsHtml = '<p class="text-sm text-gray-500 text-center mt-4">Пусто</p>';
        }

        column.innerHTML = `
            <h3 class="font-bold text-gray-100 text-center">${stageName}</h3>
            <div class="kanban-cards" data-status="${stageName}">${cardsHtml}</div>
        `;
        container.appendChild(column);

        new Sortable(column.querySelector('.kanban-cards'), { 
            group: 'requests', 
            animation: 150, 
            onEnd: (evt) => {
                // ...
            }
        });
    });
}


// ============== ОРИГИНАЛЬНЫЕ ФУНКЦИИ (ПОКА БЕЗ ИЗМЕНЕНИЙ) ==============

function renderEmployeeDetailsPage(container, employeeId) {
    const employee = data.employees.find(e => e.id == employeeId);
    if (!employee) { container.innerHTML = '<h2>Сотрудник не найден</h2>'; return; }
    pageTitle.textContent = employee.name;
    container.appendChild(document.getElementById('template-employee-details').content.cloneNode(true));
    const form = container.querySelector('#edit-employee-form');
    form.innerHTML = `
        <input type="hidden" id="edit-employee-id" value="${employee.id}">
        <label for="edit-employee-name">ФИО:</label>
        <input type="text" id="edit-employee-name" value="${employee.name}" required>
        <label for="edit-employee-role">Должность:</label>
        <input type="text" id="edit-employee-role" value="${employee.role}" required>
        <label for="edit-employee-department">Отдел:</label>
        <select id="edit-employee-department" required></select>
        <button type="submit" class="primary-btn">Сохранить изменения</button>
    `;
    const departmentSelect = form.querySelector('#edit-employee-department');
    data.departments.forEach(dep => { departmentSelect.innerHTML += `<option value="${dep.id}">${dep.name}</option>`; });
    departmentSelect.value = employee.departmentId;
    const requestsLog = container.querySelector('#employee-requests-log');
    requestsLog.innerHTML = '';
    const assignedRequests = data.requests.filter(
        r => r.managerId == employeeId || r.engineerId == employeeId
    ).sort((a,b) => b.id - a.id);
    if (assignedRequests.length === 0) {
        requestsLog.innerHTML = '<p>За сотрудником не закреплено ни одной заявки.</p>';
        return;
    }
    assignedRequests.forEach(req => {
        const client = data.clients.find(c => c.id == req.clientId) || { companyName: 'Клиент не найден' };
        let roleInRequest = [];
        if (req.managerId == employeeId) roleInRequest.push('Менеджер');
        if (req.engineerId == employeeId) roleInRequest.push('Инженер');
        const logItem = document.createElement('div');
        logItem.className = 'log-item';
        logItem.innerHTML = `
            <p><strong><a href="#" onclick="event.preventDefault(); window.openRequestDetails(${req.id})">Заявка #${req.id}</a></strong> для ${client.companyName}</p>
            <p>Статус: ${req.status}</p>
            <p class="log-meta">Роль: ${roleInRequest.join(', ')}</p>
        `;
        requestsLog.appendChild(logItem);
    });
}

function renderEmployeeListPage(container) {
    headerButtonsContainer.innerHTML = `
        <button id="go-to-create-department" class="primary-btn">Добавить отдел</button>
        <button id="go-to-create-employee" class="primary-btn">Добавить сотрудника</button>
    `;
    container.innerHTML = `<div class="page-view"><div class="employee-list-header"><div>Имя</div><div>Должность</div><div>Отдел</div></div><div class="employee-list-view"></div></div>`;
    const listContainer = container.querySelector('.employee-list-view');
    if (!data.employees || data.employees.length === 0) { listContainer.innerHTML += '<p>Сотрудники не найдены.</p>'; return; }
    
    const enrichedEmployees = data.employees.map(emp => {
        const department = data.departments.find(d => d.id === emp.departmentId) || { name: 'Не распределен', parentId: null };
        const parentDept = data.departments.find(d => d.id === department.parentId) || { id: department.parentId || -1, name: 'Основная группа' };
        return { ...emp, department, parentDept };
    });
    enrichedEmployees.sort((a, b) => (a.parentDept && b.parentDept) ? a.parentDept.id - b.parentDept.id : 0);

    let currentGroupId = null;
    enrichedEmployees.forEach(emp => {
        if (emp.parentDept && emp.parentDept.id !== currentGroupId) {
            currentGroupId = emp.parentDept.id;
            const groupHeader = document.createElement('div');
            groupHeader.className = 'employee-group-header';
            groupHeader.textContent = emp.parentDept.name;
            listContainer.appendChild(groupHeader);
        }
        const card = document.createElement('div');
        card.className = 'employee-card';
        card.innerHTML = `<div class="employee-card-name" onclick="window.openEmployeeDetails(${emp.id})">${emp.name}</div><div class="employee-card-role">${emp.role}</div><div class="employee-card-department">${emp.department.name}</div>`;
        listContainer.appendChild(card);
    });
}

function renderDocuments(container) {
    container.innerHTML = '<div class="page-view"><h2>Раздел "Документы" в разработке</h2></div>';
}

function renderCreateRequestPage(container) {
    container.appendChild(document.getElementById('template-create-request').content.cloneNode(true));
    const clientSelect = container.querySelector('#request-client');
    const managerSelect = container.querySelector('#request-manager');
    const engineerSelect = container.querySelector('#request-engineer');
    const newClientFields = container.querySelector('#new-client-fields');
    clientSelect.innerHTML = '<option value="">-- Выберите --</option><option value="new">-- Создать нового --</option>';
    data.clients.forEach(c => { clientSelect.innerHTML += `<option value="${c.id}">${c.companyName}</option>`; });
    managerSelect.innerHTML = '<option value="">-- Выберите --</option>';
    engineerSelect.innerHTML = '<option value="">-- Выберите --</option>';
    data.employees.forEach(emp => {
        const option = `<option value="${emp.id}">${emp.name} (${emp.role})</option>`;
        managerSelect.innerHTML += option;
        engineerSelect.innerHTML += option;
    });
    clientSelect.addEventListener('change', () => {
        newClientFields.classList.toggle('hidden', clientSelect.value !== 'new');
        newClientFields.querySelector('#new-client-company-name').required = (clientSelect.value === 'new');
    });
}

function renderEditRequestPage(container, requestId) {
    const request = data.requests.find(r => r.id == requestId);
    if (!request) { container.innerHTML = `<div class="page-view"><h2>Заявка не найдена</h2></div>`; return; }
    
    container.appendChild(document.getElementById('template-edit-request').content.cloneNode(true));
    const client = data.clients.find(c => c.id == request.clientId) || {};
    pageTitle.textContent = `Редактирование заявки`;
    container.querySelector('#edit-request-title-id').textContent = request.id;
    container.querySelector('#edit-request-title-client').textContent = client.companyName;
    
    const form = container.querySelector('#edit-request-form');
    form.innerHTML = `
        <input type="hidden" id="edit-request-id" value="${request.id}">
        <label for="edit-request-client">Клиент:</label><select id="edit-request-client" required></select>
        <label for="edit-request-city">Город:</label><input type="text" id="edit-request-city" value="${request.city || ''}">
        <label for="edit-request-address">Адрес:</label><input type="text" id="edit-request-address" value="${request.address || ''}">
        <label for="edit-request-deadline">Срок выполнения:</label><input type="date" id="edit-request-deadline" value="${request.deadline ? new Date(request.deadline).toISOString().split('T')[0] : ''}">
        <label for="edit-request-info">Доп. информация:</label><textarea id="edit-request-info" rows="4">${request.info || ''}</textarea>
        <label for="edit-request-manager">Отв. менеджер:</label><select id="edit-request-manager" required></select>
        <label for="edit-request-engineer">Отв. инженер:</label><select id="edit-request-engineer" required></select>
        <div class="financial-block">
            <h4>Финансы</h4>
            <label>Цена контракта:</label><input type="number" id="edit-request-amount" value="${request.amount}" required>
            <label>Себестоимость:</label><input type="number" id="edit-request-cost" value="${request.cost || 0}">
        </div>
        <button type="submit" class="primary-btn">Сохранить</button>
        <button type="button" id="generate-pdf-btn" class="primary-btn secondary-btn" style="margin-top:10px;">Создать КП (.doc)</button>
    `;

    const clientSelect = form.querySelector('#edit-request-client');
    data.clients.forEach(c => { clientSelect.innerHTML += `<option value="${c.id}">${c.companyName}</option>`; });
    clientSelect.value = request.clientId;

    const managerSelect = form.querySelector('#edit-request-manager');
    const engineerSelect = form.querySelector('#edit-request-engineer');
    data.employees.forEach(emp => {
        const option = `<option value="${emp.id}">${emp.name}</option>`;
        managerSelect.innerHTML += option;
        engineerSelect.innerHTML += option;
    });
    managerSelect.value = request.managerId;
    engineerSelect.value = request.engineerId;
    
    const activityFeed = container.querySelector('#activity-feed');
    activityFeed.innerHTML = '';
    const combinedFeed = [
        ...(request.activityLog || []).map(item => ({ ...item, feedType: 'log' })),
        ...(request.comments || []).map(item => ({ ...item, feedType: 'comment' }))
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    combinedFeed.forEach(item => {
        const feedElement = document.createElement('div');
        feedElement.className = 'log-item';
        const date = new Date(item.timestamp).toLocaleString();
        if (item.feedType === 'comment') {
            const author = data.employees.find(e => e.id === item.authorId) || { name: 'Неизвестный' };
            feedElement.innerHTML = `<p class="comment-author">${author.name}</p><p class="comment-text">${item.text}</p><p class="comment-meta">${date}</p>`;
        } else {
            feedElement.classList.add('system-event');
            feedElement.innerHTML = `<p class="log-text">${item.text}</p><p class="log-meta">${date}</p>`;
        }
        activityFeed.appendChild(feedElement);
    });

    const tasksContainer = container.querySelector('#request-tasks');
    tasksContainer.innerHTML = '';
    if (request.tasks && request.tasks.length > 0) {
        request.tasks.forEach((task, index) => {
            const taskElement = document.createElement('div');
            taskElement.className = 'task-item';
            if (task.completed) taskElement.classList.add('completed');
            taskElement.innerHTML = `<input type="checkbox" id="task-${index}" data-task-index="${index}" ${task.completed ? 'checked' : ''}><label for="task-${index}">${task.text}</label>`;
            tasksContainer.appendChild(taskElement);
        });
    }
}

function renderClientListPage(container) {
    headerButtonsContainer.innerHTML = `<button id="go-to-create-client" class="primary-btn">Добавить клиента</button>`;
    const listHeader = `<div class="employee-list-header"><div>Компания</div><div>Контактное лицо</div><div>Статус</div></div>`;
    container.innerHTML = `<div class="page-view"><div class="employee-list-view">${listHeader}</div></div>`;
    const listContainer = container.querySelector('.employee-list-view');
    if (!data.clients || data.clients.length === 0) { listContainer.innerHTML += '<p>Клиенты не найдены.</p>'; return; }
    
    const groupedByRegion = data.clients.reduce((acc, client) => {
        const region = client.region || 'Без региона';
        if (!acc[region]) acc[region] = [];
        acc[region].push(client);
        return acc;
    }, {});

    for (const region in groupedByRegion) {
        const groupHeader = document.createElement('div');
        groupHeader.className = 'employee-group-header';
        groupHeader.textContent = region;
        listContainer.appendChild(groupHeader);
        groupedByRegion[region].forEach(client => {
            const card = document.createElement('div');
            card.className = 'employee-card';
            card.innerHTML = `<div class="employee-card-name" onclick="window.openClientDetails(${client.id})">${client.companyName}</div><div>${client.contactPerson || '-'}</div><div>${client.status}</div>`;
            listContainer.appendChild(card);
        });
    }
}

function renderClientDetailsPage(container, clientId) {
    const client = data.clients.find(c => c.id == clientId);
    if (!client) { container.innerHTML = '<h2>Клиент не найден</h2>'; return; }
    
    pageTitle.textContent = client.companyName;
    container.innerHTML = '';
    container.appendChild(document.getElementById('template-client-details').content.cloneNode(true));
    
    const statusBar = container.querySelector('.client-status-bar');
    statusBar.innerHTML = '';
    data.clientStatuses.forEach(status => {
        const item = document.createElement('div');
        item.className = 'status-item';
        if (status === client.status) item.classList.add('active');
        item.textContent = status;
        item.setAttribute('onclick', `window.updateClientStatus(${clientId}, "${status}")`);
        statusBar.appendChild(item);
    });

    const infoForm = container.querySelector('#edit-client-form');
    infoForm.innerHTML = `
        <input type="hidden" id="edit-client-id" value="${client.id}">
        <label>Название компании:</label><input type="text" id="edit-client-company-name" value="${client.companyName}">
        <label>Контактное лицо:</label><input type="text" id="edit-client-contact-person" value="${client.contactPerson || ''}">
        <label>Контакты:</label><input type="text" id="edit-client-contacts" value="${client.contacts || ''}">
        <label>Регион:</label><input type="text" id="edit-client-region" value="${client.region || ''}">
        <button type="submit" class="primary-btn">Сохранить</button>
    `;
    
    const logColumn = container.querySelector('.activity-log');
    const clientRequests = data.requests.filter(r => r.clientId == clientId).sort((a,b) => b.id - a.id);
    logColumn.innerHTML = '';
    if (clientRequests.length > 0) {
        clientRequests.forEach(req => {
            const creationLog = (req.activityLog || []).find(log => log.text && log.text.includes('создана'));
            const creationTimestamp = creationLog ? new Date(creationLog.timestamp).toLocaleDateString() : 'N/A';
            const logItemElement = document.createElement('div');
            logItemElement.className = 'log-item';
            logItemElement.innerHTML = `
                <p><strong><a href="#" onclick="event.preventDefault(); window.openRequestDetails(${req.id})">Заявка #${req.id}</a></strong></p>
                <p>Сумма: ${Number(req.amount).toLocaleString()} тг.</p>
                <p>Статус: ${req.status}</p>
                <p class="log-meta">Создана: ${creationTimestamp}</p>
            `;
            logColumn.appendChild(logItemElement);
        });
    } else {
        logColumn.innerHTML = '<p>Заявок по этому клиенту пока нет.</p>';
    }
}

function renderCreateDepartmentPage(container) {
    container.appendChild(document.getElementById('template-create-department').content.cloneNode(true));
    const parentSelect = container.querySelector('#parent-department');
    parentSelect.innerHTML = '<option value="null">-- Корневой отдел --</option>';
    data.departments.forEach(dep => { parentSelect.innerHTML += `<option value="${dep.id}">${dep.name}</option>`; });
}

function renderCreateClientPage(container) {
    container.appendChild(document.getElementById('template-create-client').content.cloneNode(true));
    const statusSelect = container.querySelector('#client-status');
    data.clientStatuses.forEach(status => { statusSelect.innerHTML += `<option value="${status}">${status}</option>`; });
}

function renderCreateEmployeePage(container) {
    container.appendChild(document.getElementById('template-create-employee').content.cloneNode(true));
    const departmentSelect = container.querySelector('#employee-department');
    data.departments.forEach(dep => { departmentSelect.innerHTML += `<option value="${dep.id}">${dep.name}</option>`; });
}

export function closePopup() {}