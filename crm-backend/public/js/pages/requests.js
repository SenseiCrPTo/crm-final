// js/pages/requests.js

/**
 * Отрисовывает страницу заявок в виде адаптивной канбан-доски.
 * @param {HTMLElement} container - Контейнер для рендеринга.
 * @param {object} data - Объект с данными приложения.
 */
export function renderRequestsPage(container, data) {
    container.className = 'flex overflow-x-auto space-x-4 pb-4'; 
    
    data.cgmStages.forEach(stageName => {
        const column = document.createElement('div');
        column.className = 'flex-shrink-0 w-80 bg-gray-900 rounded-xl p-4';
        
        const requestsForStage = data.requests.filter(req => req.status === stageName);
        
        let cardsHtml = requestsForStage.map(req => {
            const client = data.clients.find(c => c.id === req.clientId) || {};
            return `
                <div class="bg-gray-800 rounded-lg p-4 mt-4 cursor-pointer hover:bg-gray-700" data-action="details" data-entity="request" data-id="${req.id}">
                    <h4 class="font-semibold text-gray-100">${client.companyName || 'Неизвестный клиент'}</h4>
                    <p class="text-sm text-gray-400 mt-1">${Number(req.amount || 0).toLocaleString()} ₸</p>
                </div>
            `;
        }).join('');

        if (requestsForStage.length === 0) {
            cardsHtml = '<p class="text-sm text-gray-500 text-center mt-4">Пусто</p>';
        }

        column.innerHTML = `
            <h3 class="font-bold text-gray-100 text-center">${stageName}</h3>
            <div class="kanban-cards space-y-3 mt-3" data-status="${stageName}">${cardsHtml}</div>
        `;
        container.appendChild(column);

        // Здесь можно инициализировать Sortable.js, если он подключен
        // new Sortable(column.querySelector('.kanban-cards'), { ... });
    });
}

/**
 * Отрисовывает форму создания новой заявки.
 * @param {HTMLElement} container - Контейнер для рендеринга.
 * @param {object} data - Объект с данными приложения.
 */
export function renderCreateRequestPage(container, data) {
    const clientOptions = data.clients.map(c => `<option value="${c.id}">${c.companyName}</option>`).join('');
    const employeeOptions = data.employees.map(emp => `<option value="${emp.id}">${emp.name} (${emp.role})</option>`).join('');

    container.innerHTML = `
        <form data-action="create" data-entity="request" class="space-y-4 max-w-lg mx-auto">
            <h2 class="text-xl font-bold">Новая заявка</h2>
            
            <div>
                <label for="request-client" class="block text-sm font-medium text-gray-300">Клиент</label>
                <select id="request-client" name="clientId" class="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-red-500 focus:ring-red-500">
                    <option value="">-- Выберите клиента --</option>
                    <option value="new">-- Создать нового --</option>
                    ${clientOptions}
                </select>
            </div>
            
            <div id="new-client-fields" class="hidden space-y-4 border-l-2 border-red-500 pl-4">
                <p class="text-sm font-bold text-gray-200">Данные нового клиента</p>
                <div>
                    <label for="new-client-company-name" class="block text-sm font-medium text-gray-300">Название компании</label>
                    <input type="text" id="new-client-company-name" name="newClientCompanyName" class="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm">
                </div>
                <div>
                    <label for="new-client-contact-person" class="block text-sm font-medium text-gray-300">Контактное лицо</label>
                    <input type="text" id="new-client-contact-person" name="newClientContactPerson" class="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm">
                </div>
            </div>

            <div>
                <label for="request-info" class="block text-sm font-medium text-gray-300">Информация по заявке</label>
                <textarea id="request-info" name="info" rows="4" required class="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm"></textarea>
            </div>

             <div>
                <label for="request-manager" class="block text-sm font-medium text-gray-300">Ответственный менеджер</label>
                <select id="request-manager" name="managerId" class="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm">
                    <option value="">-- Не назначен --</option>
                    ${employeeOptions}
                </select>
            </div>

            <button type="submit" class="primary-btn">Создать заявку</button>
        </form>
    `;

    // Логика для отображения полей нового клиента
    const clientSelect = container.querySelector('#request-client');
    const newClientFields = container.querySelector('#new-client-fields');
    clientSelect.addEventListener('change', () => {
        const isNew = clientSelect.value === 'new';
        newClientFields.classList.toggle('hidden', !isNew);
        newClientFields.querySelector('#new-client-company-name').required = isNew;
    });
}

/**
 * Отрисовывает страницу редактирования заявки.
 * @param {HTMLElement} container - Контейнер для рендеринга.
 * @param {number} requestId - ID заявки.
 * @param {object} data - Объект с данными приложения.
 */
export function renderEditRequestPage(container, requestId, data) {
    const request = data.requests.find(r => r.id == requestId);
    if (!request) {
        container.innerHTML = `<p class="text-center text-gray-400">Заявка не найдена.</p>`;
        return;
    }

    const client = data.clients.find(c => c.id == request.clientId) || {};
    document.getElementById('page-title').textContent = `Заявка #${request.id}: ${client.companyName || ''}`;

    const clientOptions = data.clients.map(c => `<option value="${c.id}" ${c.id === request.clientId ? 'selected' : ''}>${c.companyName}</option>`).join('');
    const employeeOptions = data.employees.map(emp => `<option value="${emp.id}">${emp.name}</option>`).join('');
    
    container.innerHTML = `
        <form data-action="edit" data-entity="request" class="space-y-6 max-w-2xl mx-auto">
            <input type="hidden" name="id" value="${request.id}">

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label for="edit-request-client" class="block text-sm font-medium text-gray-300">Клиент</label>
                    <select id="edit-request-client" name="clientId" required class="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white">${clientOptions}</select>
                </div>
                <div>
                    <label for="edit-request-status" class="block text-sm font-medium text-gray-300">Статус</label>
                    <select id="edit-request-status" name="status" required class="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white">
                        ${data.cgmStages.map(s => `<option value="${s}" ${s === request.status ? 'selected' : ''}>${s}</option>`).join('')}
                    </select>
                </div>
                <div>
                    <label for="edit-request-city" class="block text-sm font-medium text-gray-300">Город</label>
                    <input type="text" id="edit-request-city" name="city" value="${request.city || ''}" class="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white">
                </div>
                <div>
                    <label for="edit-request-address" class="block text-sm font-medium text-gray-300">Адрес</label>
                    <input type="text" id="edit-request-address" name="address" value="${request.address || ''}" class="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white">
                </div>
                <div>
                    <label for="edit-request-manager" class="block text-sm font-medium text-gray-300">Отв. менеджер</label>
                    <select id="edit-request-manager" name="managerId" class="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white">
                        <option value="">-- Не назначен --</option>
                        ${data.employees.map(e => `<option value="${e.id}" ${e.id === request.managerId ? 'selected' : ''}>${e.name}</option>`).join('')}
                    </select>
                </div>
                 <div>
                    <label for="edit-request-engineer" class="block text-sm font-medium text-gray-300">Отв. инженер</label>
                    <select id="edit-request-engineer" name="engineerId" class="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white">
                        <option value="">-- Не назначен --</option>
                        ${data.employees.map(e => `<option value="${e.id}" ${e.id === request.engineerId ? 'selected' : ''}>${e.name}</option>`).join('')}
                    </select>
                </div>
                <div>
                    <label for="edit-request-amount" class="block text-sm font-medium text-gray-300">Цена контракта</label>
                    <input type="number" id="edit-request-amount" name="amount" value="${request.amount || ''}" class="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white">
                </div>
                <div>
                    <label for="edit-request-cost" class="block text-sm font-medium text-gray-300">Себестоимость</label>
                    <input type="number" id="edit-request-cost" name="cost" value="${request.cost || ''}" class="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white">
                </div>
            </div>

            <div>
                <label for="edit-request-info" class="block text-sm font-medium text-gray-300">Доп. информация</label>
                <textarea id="edit-request-info" name="info" rows="5" class="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white">${request.info || ''}</textarea>
            </div>
            
            <button type="submit" class="primary-btn">Сохранить изменения</button>
        </form>
    `;
}