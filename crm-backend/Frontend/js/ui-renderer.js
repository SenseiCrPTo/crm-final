import { data } from './data-manager.js';

const pageContainer = document.getElementById('page-content-container');
const headerButtonsContainer = document.getElementById('header-buttons');
const pageTitle = document.getElementById('page-title');

let appState = {
    kanbanFilterEmployeeId: 'all'
};

export function renderPage(pageId, contextId = null) {
    pageContainer.innerHTML = '';
    headerButtonsContainer.innerHTML = '';
    pageContainer.className = '';
    let title = 'Главная';

    switch (pageId) {
        case 'dashboard':
            title = 'Главная';
            renderDashboard(pageContainer);
            break;
        case 'requests':
            title = 'Заявки';
            renderRequestsPage(pageContainer);
            break;
        case 'create-request':
            title = 'Создание новой заявки';
            renderCreateRequestPage(pageContainer);
            break;
        case 'edit-request':
            renderEditRequestPage(pageContainer, contextId);
            break;
        case 'clients':
            title = 'Клиенты';
            renderClientListPage(pageContainer);
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
            renderDepartmentsPage(pageContainer);
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
            title = 'Документы';
            renderDocuments(pageContainer);
            break;
        default:
            pageId = 'dashboard';
            title = 'Главная';
            renderDashboard(pageContainer);
    }
    
    if (!['client-details', 'edit-request', 'employee-details'].includes(pageId)) {
        pageTitle.textContent = title;
    }
    updateActiveNav(pageId);
}

function renderDashboard(container) {
    const deals = data.requests.filter(r => r.status !== 'Сделка проиграна');
    const totalAmount = deals.reduce((sum, deal) => sum + (Number(deal.amount) || 0), 0);
    const totalCost = deals.reduce((sum, deal) => sum + (Number(deal.cost) || 0), 0);
    const totalProfit = totalAmount - totalCost;
    const averageProfitPercentage = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;
    const clientCount = data.clients.length;
    const currentUser = data.employees[0] || { id: -1, name: 'N/A' };
    const activeStatuses = data.cgmStages.slice(0, data.cgmStages.indexOf('Контракт завершен'));
    const myActiveRequests = data.requests.filter(r => 
        (r.managerId === currentUser.id || r.engineerId === currentUser.id) &&
        activeStatuses.includes(r.status)
    ).slice(0, 5);
    const recentActivities = data.requests.flatMap(r => 
        (r.activityLog || []).map(log => ({ ...log, requestId: r.id, client: data.clients.find(c=>c.id === r.clientId) }))
    ).sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp))
     .slice(0, 5);
    const clientIdsWithRequests = new Set(data.requests.map(r => r.clientId));
    const inactiveClients = data.clients.filter(c => !clientIdsWithRequests.has(c.id)).slice(0, 5);
    container.innerHTML = `
        <div class="dashboard-grid">
            <div class="dashboard-widget col-span-2">
                <h3 class="widget-title">Доход</h3>
                <div class="stats-container">
                    <div class="stat-item">
                        <div class="stat-value">${totalAmount.toLocaleString()} ₽</div>
                        <div class="stat-label">Сумма сделок</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${totalProfit.toLocaleString()} ₽</div>
                        <div class="stat-label">Прибыль</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${averageProfitPercentage.toFixed(1)}%</div>
                        <div class="stat-label">Средний % прибыли</div>
                    </div>
                </div>
            </div>
            <div class="dashboard-widget">
                <h3 class="widget-title">Клиенты</h3>
                <div class="stats-container">
                    <div class="stat-item">
                        <div class="stat-value">${clientCount}</div>
                        <div class="stat-label">Всего клиентов</div>
                    </div>
                </div>
            </div>
            <div class="dashboard-widget">
                <h3 class="widget-title">Мои активные заявки (${currentUser.name})</h3>
                <ul class="widget-list">
                    ${myActiveRequests.length > 0 ? myActiveRequests.map(r => `
                        <li class="widget-list-item">
                            <a href="#" onclick="event.preventDefault(); window.openRequestDetails(${r.id})">Заявка #${r.id}</a>
                            <span class="meta">${(data.clients.find(c=>c.id === r.clientId) || {}).companyName || ''} - ${r.status}</span>
                        </li>
                    `).join('') : '<li class="widget-list-item"><span class="meta">Активных заявок нет</span></li>'}
                </ul>
            </div>
            <div class="dashboard-widget">
                <h3 class="widget-title">Последние действия</h3>
                <ul class="widget-list">
                    ${recentActivities.length > 0 ? recentActivities.map(log => `
                        <li class="widget-list-item">
                            <a href="#" onclick="event.preventDefault(); window.openRequestDetails(${log.requestId})">${log.text || 'Действие без описания'}</a>
                            <span class="meta">${new Date(log.timestamp).toLocaleString()}</span>
                        </li>
                    `).join('') : '<li class="widget-list-item"><span class="meta">Событий нет</span></li>'}
                </ul>
            </div>
            <div class="dashboard-widget">
                <h3 class="widget-title">Клиенты без активности</h3>
                <ul class="widget-list">
                    ${inactiveClients.length > 0 ? inactiveClients.map(c => `
                        <li class="widget-list-item">
                            <a href="#" onclick="event.preventDefault(); window.openClientDetails(${c.id})">${c.companyName}</a>
                            <span class="meta">Статус: ${c.status}</span>
                        </li>
                    `).join('') : '<li class="widget-list-item"><span class="meta">Все клиенты активны</span></li>'}
                </ul>
            </div>
        </div>
    `;
}

function renderRequestsPage(container) {
    headerButtonsContainer.innerHTML = `
        <div class="header-controls">
            <label for="kanban-filter-employee">Ответственный:</label>
            <select id="kanban-filter-employee"></select>
            <button id="go-to-create-request" class="primary-btn">Новая заявка</button>
        </div>
    `;
    const filterSelect = headerButtonsContainer.querySelector('#kanban-filter-employee');
    filterSelect.innerHTML = `<option value="all">Все сотрудники</option>`;
    data.employees.forEach(emp => {
        filterSelect.innerHTML += `<option value="${emp.id}">${emp.name}</option>`;
    });
    filterSelect.value = appState.kanbanFilterEmployeeId;
    filterSelect.addEventListener('change', (e) => {
        appState.kanbanFilterEmployeeId = e.target.value;
        renderPage('requests');
    });
    
    container.className = 'kanban-board';
    let filteredRequests = data.requests;
    const selectedEmployeeId = appState.kanbanFilterEmployeeId;
    if (selectedEmployeeId !== 'all') {
        const employeeId = parseInt(selectedEmployeeId);
        filteredRequests = data.requests.filter(
            req => req.managerId === employeeId || req.engineerId === employeeId
        );
    }
    data.cgmStages.forEach(stageName => {
        const column = document.createElement('div');
        column.className = 'kanban-column';
        column.innerHTML = `<h4 class="kanban-column-title">${stageName}</h4><div class="kanban-cards" data-status="${stageName}"></div>`;
        const cardsContainer = column.querySelector('.kanban-cards');
        const requestsForStage = filteredRequests.filter(req => req.status === stageName);
        if (requestsForStage.length === 0) {
            cardsContainer.innerHTML = '<p class="empty-column-message">Пусто</p>';
        } else {
            requestsForStage.forEach(req => {
                const client = data.clients.find(c => c.id === req.clientId) || { companyName: 'Клиент не найден' };
                const card = document.createElement('div');
                card.className = 'request-card';
                card.dataset.id = req.id;
                card.setAttribute('onclick', `window.openRequestDetails(${req.id})`);
                card.innerHTML = `<h4>${client.companyName}</h4><p>Сумма: ${Number(req.amount).toLocaleString()} руб.</p>`;
                cardsContainer.appendChild(card);
            });
        }
        container.appendChild(column);
    });
    container.querySelectorAll('.kanban-cards').forEach(column => {
        new Sortable(column, { group: 'requests', animation: 150, onEnd: (evt) => {
            const requestId = parseInt(evt.item.dataset.id);
            const newStatus = evt.to.dataset.status;
            window.updateRequestStatus(requestId, newStatus);
        }});
    });
}

function renderEmployeeDetailsPage(container, employeeId) {
    const employee = data.employees.find(e => e.id == employeeId);
    if (!employee) { container.innerHTML = '<h2>Сотрудник не найден</h2>'; return; }
    pageTitle.textContent = employee.name;
    const view = document.getElementById('template-employee-details').content.cloneNode(true);
    const form = view.querySelector('#edit-employee-form');
    form.dataset.action = "edit";
    form.dataset.entity = "employee";
    form.innerHTML = `
        <input type="hidden" name="id" value="${employee.id}">
        <label for="edit-employee-name">ФИО:</label>
        <input type="text" name="name" value="${employee.name}" required>
        <label for="edit-employee-role">Должность:</label>
        <input type="text" name="role" value="${employee.role}" required>
        <label for="edit-employee-department">Отдел:</label>
        <select name="departmentId" required></select>
        <button type="submit" class="primary-btn">Сохранить изменения</button>
    `;
    populateSelect(form.querySelector('[name="departmentId"]'), data.departments, 'id', 'name');
    form.querySelector('[name="departmentId"]').value = employee.departmentId;

    const requestsLog = view.querySelector('#employee-requests-log');
    requestsLog.innerHTML = '';
    const assignedRequests = data.requests.filter(
        r => r.managerId == employeeId || r.engineerId == employeeId
    ).sort((a,b) => b.id - a.id);
    if (assignedRequests.length === 0) {
        requestsLog.innerHTML = '<p>За сотрудником не закреплено ни одной заявки.</p>';
    } else {
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
    container.appendChild(view);
}

function renderDepartmentsPage(container) {
    headerButtonsContainer.innerHTML = `
        <button data-action="create" data-entity="department" class="primary-btn">Добавить отдел</button>
        <button data-action="create" data-entity="employee" class="primary-btn">Добавить сотрудника</button>
    `;
    renderEmployeeListPage(container);
}

function renderEmployeeListPage(container) {
    container.innerHTML = `<div class="page-view"><div class="employee-list-header"><div>Имя</div><div>Должность</div><div>Отдел</div></div><div class="employee-list-view"></div></div>`;
    const listContainer = container.querySelector('.employee-list-view');
    if (!data.employees || data.employees.length === 0) { listContainer.innerHTML += '<p>Сотрудники не найдены.</p>'; return; }
    
    data.employees.forEach(emp => {
        const department = data.departments.find(d => d.id === emp.departmentId) || { name: 'Не распределен' };
        const card = document.createElement('div');
        card.className = 'employee-card';
        card.innerHTML = `
            <div class="employee-card-name">
                <a href="#" data-action="details" data-entity="employee" data-id="${emp.id}">${emp.name}</a>
            </div>
            <div>${emp.role}</div>
            <div>${department.name}</div>
        `;
        listContainer.appendChild(card);
    });
}

function renderDocuments(container) {
    container.innerHTML = '<div class="page-view"><h2>Раздел "Документы" в разработке</h2></div>';
}

function renderCreateRequestPage(container) {
    const view = document.getElementById('template-create-request').content.cloneNode(true);
    const clientSelect = view.querySelector('#request-client');
    const newClientFields = view.querySelector('#new-client-fields');
    
    populateSelect(view.querySelector('#request-manager'), data.employees, 'id', 'name', 'Выберите');
    populateSelect(view.querySelector('#request-engineer'), data.employees, 'id', 'name', 'Выберите');
    populateSelect(clientSelect, data.clients, 'id', 'companyName', 'Выберите');
    clientSelect.innerHTML += '<option value="new">-- Создать нового клиента --</option>';

    clientSelect.addEventListener('change', () => {
        newClientFields.classList.toggle('hidden', clientSelect.value !== 'new');
        newClientFields.querySelector('#new-client-company-name').required = (clientSelect.value === 'new');
    });
    container.appendChild(view);
}

function renderEditRequestPage(container, requestId) {
    const request = data.requests.find(r => r.id == requestId);
    if (!request) { container.innerHTML = `<h2>Заявка не найдена</h2>`; return; }
    
    const client = data.clients.find(c => c.id == request.clientId) || {};
    pageTitle.textContent = `Заявка #${request.id}`;
    
    const view = document.getElementById('template-edit-request').content.cloneNode(true);
    view.querySelector('#edit-request-title-id').textContent = request.id;
    view.querySelector('#edit-request-title-client').textContent = client.companyName;
    
    const form = view.querySelector('#edit-request-form');
    form.dataset.action = "edit";
    form.dataset.entity = "request";
    form.innerHTML = `
        <input type="hidden" name="id" value="${request.id}">
        <label>Клиент:</label><select name="clientId" required></select>
        <label>Город:</label><input type="text" name="city" value="${request.city || ''}">
        <label>Адрес:</label><input type="text" name="address" value="${request.address || ''}">
        <label>Срок:</label><input type="date" name="deadline" value="${request.deadline ? new Date(request.deadline).toISOString().split('T')[0] : ''}">
        <label>Инфо:</label><textarea name="info" rows="3">${request.info || ''}</textarea>
        <label>Менеджер:</label><select name="managerId" required></select>
        <label>Инженер:</label><select name="engineerId" required></select>
        <h4>Финансы</h4>
        <label>Сумма:</label><input type="number" name="amount" value="${request.amount || 0}" required>
        <label>Себестоимость:</label><input type="number" name="cost" value="${request.cost || 0}">
        <button type="submit" class="primary-btn">Сохранить</button>
        <button type="button" id="generate-doc-btn" class="primary-btn secondary-btn">Создать КП (.doc)</button>
    `;
    
    populateSelect(form.querySelector('[name="clientId"]'), data.clients, 'id', 'companyName');
    form.querySelector('[name="clientId"]').value = request.clientId;
    populateSelect(form.querySelector('[name="managerId"]'), data.employees, 'id', 'name');
    form.querySelector('[name="managerId"]').value = request.managerId;
    populateSelect(form.querySelector('[name="engineerId"]'), data.employees, 'id', 'name');
    form.querySelector('[name="engineerId"]').value = request.engineerId;

    const activityFeed = view.querySelector('#activity-feed');
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
            feedElement.innerHTML = `<p class="log-text">${item.action}</p><p class="log-meta">${date} - ${item.user}</p>`;
        }
        activityFeed.appendChild(feedElement);
    });

    const tasksContainer = view.querySelector('#request-tasks');
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
    
    container.appendChild(view);
}

function renderClientListPage(container) {
    headerButtonsContainer.innerHTML = `<button class="primary-btn" data-action="create" data-entity="client">Добавить клиента</button>`;
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
            card.innerHTML = `
                <div class="employee-card-name">
                    <a href="#" data-action="details" data-entity="client" data-id="${client.id}">${client.companyName}</a>
                </div>
                <div>${client.contactPerson || '-'}</div>
                <div>${client.status}</div>
            `;
            listContainer.appendChild(card);
        });
    }
}

function renderClientDetailsPage(container, clientId) {
    const client = data.clients.find(c => c.id == clientId);
    if (!client) { container.innerHTML = '<h2>Клиент не найден</h2>'; return; }
    
    pageTitle.textContent = client.companyName;
    const view = document.getElementById('template-client-details').content.cloneNode(true);
    
    const statusBar = view.querySelector('.client-status-bar');
    statusBar.innerHTML = '';
    data.clientStatuses.forEach(status => {
        const item = document.createElement('div');
        item.className = 'status-item';
        if (status === client.status) item.classList.add('active');
        item.textContent = status;
        item.setAttribute('onclick', `window.updateClientStatus(${clientId}, "${status}")`);
        statusBar.appendChild(item);
    });

    const infoForm = view.querySelector('#edit-client-form');
    infoForm.dataset.action = "edit";
    infoForm.dataset.entity = "client";
    infoForm.innerHTML = `
        <input type="hidden" name="id" value="${client.id}">
        <label>Название компании:</label><input type="text" name="companyName" value="${client.companyName}">
        <label>Контактное лицо:</label><input type="text" name="contactPerson" value="${client.contactPerson || ''}">
        <label>Контакты:</label><input type="text" name="contacts" value="${client.contacts || ''}">
        <label>Регион:</label><input type="text" name="region" value="${client.region || ''}">
        <button type="submit" class="primary-btn">Сохранить</button>
    `;
    
    const logColumn = view.querySelector('.activity-log');
    logColumn.innerHTML = "<h3>История заявок</h3>";
    const clientRequests = data.requests.filter(r => r.clientId == clientId).sort((a,b) => b.id - a.id);
    if (clientRequests.length > 0) {
        clientRequests.forEach(req => {
            const logItemElement = document.createElement('div');
            logItemElement.className = 'log-item';
            logItemElement.innerHTML = `
                <p><strong><a href="#" data-action="details" data-entity="request" data-id="${req.id}">Заявка #${req.id}</a></strong></p>
                <p>Сумма: ${Number(req.amount).toLocaleString()} руб.</p>
                <p>Статус: ${req.status}</p>
            `;
            logColumn.appendChild(logItemElement);
        });
    } else {
        logColumn.innerHTML += '<p>Заявок по этому клиенту пока нет.</p>';
    }
    
    container.appendChild(view);
}

function renderCreateDepartmentPage(container) {
    const view = document.getElementById('template-create-department').content.cloneNode(true);
    const parentSelect = view.querySelector('#parent-department');
    populateSelect(parentSelect, data.departments, 'id', 'name', '-- Корневой отдел --');
    container.appendChild(view);
}

function renderCreateClientPage(container) {
    const view = document.getElementById('template-create-client').content.cloneNode(true);
    const statusSelect = view.querySelector('#client-status');
    populateSelect(statusSelect, data.clientStatuses.map(s => ({id: s, name: s})), 'id', 'name');
    container.appendChild(view);
}

function renderCreateEmployeePage(container) {
    const view = document.getElementById('template-create-employee').content.cloneNode(true);
    const departmentSelect = view.querySelector('#employee-department');
    populateSelect(departmentSelect, data.departments, 'id', 'name', 'Выберите отдел');
    container.appendChild(view);
}

function populateSelect(selectElement, items, valueKey, textKey, placeholder = '') {
    if (!selectElement) return;
    selectElement.innerHTML = `<option value="">${placeholder}</option>`;
    items.forEach(item => {
        const option = document.createElement('option');
        option.value = item[valueKey];
        option.textContent = item[textKey];
        selectElement.appendChild(option);
    });
}

function updateActiveNav(pageId) {
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    let pageToHighlight = pageId;
    if (pageId.includes('details') || pageId.startsWith('create-') || pageId.startsWith('edit-')) {
        if (pageId.includes('client')) pageToHighlight = 'clients';
        else if (pageId.includes('request')) pageToHighlight = 'requests';
        else if (pageId.includes('employee') || pageId.includes('department')) pageToHighlight = 'departments';
    }
    const activeLink = document.querySelector(`.nav-item[data-page="${pageToHighlight}"]`);
    if (activeLink) activeLink.classList.add('active');
}

export function closePopup() {
    // Эта функция пока не нужна, так как мы не используем модальные окна
}