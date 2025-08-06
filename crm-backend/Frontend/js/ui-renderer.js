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
            headerButtonsContainer.innerHTML = `<button id="go-to-create-client" class="primary-btn">Добавить клиента</button>`;
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
            headerButtonsContainer.innerHTML = `
                <button id="go-to-create-department" class="primary-btn">Добавить отдел</button>
                <button id="go-to-create-employee" class="primary-btn">Добавить сотрудника</button>
            `;
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
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    const activePage = pageId === 'employee-details' ? 'departments' : pageId;
    document.querySelector(`.nav-item[data-page="${activePage}"]`)?.classList.add('active');
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
                            <a href="#" onclick="event.preventDefault(); window.openRequestDetails(${log.requestId})">${log.text}</a>
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
            cardsContainer.innerHTML = '<p style="font-size: 0.9em; color: grey;">Пусто</p>';
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
            <p><strong>% Прибыли (наценка):</strong> <span id="margin-display" class="margin-display">--</span>%</p>
        </div>
        <button type="submit" class="primary-btn">Сохранить</button>
        <button type="button" id="generate-pdf-btn" class="primary-btn secondary-btn" style="margin-top:10px;">Создать КП (.doc)</button>
    `;

    const amountInput = form.querySelector('#edit-request-amount');
    const costInput = form.querySelector('#edit-request-cost');
    const marginDisplay = form.querySelector('#margin-display');
    const calculateProfitPercentage = () => {
        const amount = parseFloat(amountInput.value) || 0;
        const cost = parseFloat(costInput.value) || 0;
        marginDisplay.textContent = (cost > 0) ? (((amount - cost) / cost) * 100).toFixed(1) : '---';
    };
    amountInput.addEventListener('input', calculateProfitPercentage);
    costInput.addEventListener('input', calculateProfitPercentage);
    calculateProfitPercentage();
    
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
    
    // Отрисовка комментариев, задач и логов
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
                <p>Сумма: ${Number(req.amount).toLocaleString()} руб.</p>
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