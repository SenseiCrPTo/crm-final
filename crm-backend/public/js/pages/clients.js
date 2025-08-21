// js/pages/clients.js

/**
 * Отрисовывает список клиентов в виде адаптивной сетки карточек.
 * @param {HTMLElement} container - Контейнер для рендеринга.
 * @param {object} data - Объект с данными приложения.
 */
export function renderClientListPage(container, data) {
    if (!data.clients || data.clients.length === 0) {
        container.innerHTML = '<p class="text-gray-400 text-center">Клиенты не найдены. Нажмите "Добавить клиента", чтобы создать первого.</p>';
        return;
    }
    
    container.className = 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4';
    
    const clientCards = data.clients.map(client => `
        <div class="bg-gray-800 rounded-lg p-4 shadow-lg cursor-pointer hover:bg-gray-700" 
             data-action="details" data-entity="client" data-id="${client.id}">
            <div class="flex justify-between items-center">
                <h3 class="font-bold text-lg text-gray-100">${client.companyName}</h3>
                <span class="text-xs font-medium text-gray-200 bg-gray-600 px-2 py-1 rounded-full">${client.status}</span>
            </div>
            <p class="text-sm text-gray-400 mt-2">${client.contactPerson || 'Контакт не указан'}</p>
        </div>
    `).join('');

    container.innerHTML = clientCards;
}

/**
 * Отрисовывает страницу с детальной информацией о клиенте.
 * @param {HTMLElement} container - Контейнер для рендеринга.
 * @param {number} clientId - ID клиента.
 * @param {object} data - Объект с данными приложения.
 */
export function renderClientDetailsPage(container, clientId, data) {
    const client = data.clients.find(c => c.id == clientId);
    if (!client) {
        container.innerHTML = '<h2>Клиент не найден</h2>';
        return;
    }
    
    document.getElementById('page-title').textContent = client.companyName;

    const clientRequests = data.requests.filter(r => r.clientId == clientId).sort((a,b) => b.id - a.id);
    const requestsHtml = clientRequests.length > 0 ? clientRequests.map(req => {
        const creationDate = req.activityLog && req.activityLog.length > 0 
            ? new Date(req.activityLog[0].timestamp).toLocaleDateString() 
            : 'N/A';
        return `
            <div class="log-item p-3 rounded-lg hover:bg-gray-700 cursor-pointer" data-action="details" data-entity="request" data-id="${req.id}">
                <p><strong>Заявка #${req.id}</strong></p>
                <p>Сумма: ${Number(req.amount || 0).toLocaleString()} ₸</p>
                <p>Статус: ${req.status}</p>
                <p class="log-meta text-xs text-gray-400">Создана: ${creationDate}</p>
            </div>
        `;
    }).join('') : '<p class="text-gray-400">Заявок по этому клиенту пока нет.</p>';

    container.innerHTML = `
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div class="lg:col-span-2 space-y-6">
                <form data-action="edit" data-entity="client" class="bg-gray-800 p-6 rounded-lg space-y-4">
                    <input type="hidden" name="id" value="${client.id}">
                    <h3 class="text-lg font-bold">Основная информация</h3>
                    <div>
                        <label class="block text-sm font-medium text-gray-300">Название компании</label>
                        <input type="text" name="companyName" value="${client.companyName}" class="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-300">Контактное лицо</label>
                        <input type="text" name="contactPerson" value="${client.contactPerson || ''}" class="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-300">Контакты</label>
                        <input type="text" name="contacts" value="${client.contacts || ''}" class="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white">
                    </div>
                     <div>
                        <label class="block text-sm font-medium text-gray-300">Статус</label>
                        <select name="status" class="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white">
                            ${data.clientStatuses.map(s => `<option value="${s}" ${s === client.status ? 'selected' : ''}>${s}</option>`).join('')}
                        </select>
                    </div>
                    <button type="submit" class="primary-btn">Сохранить</button>
                </form>
            </div>
            <div class="space-y-4">
                 <div class="bg-gray-800 p-6 rounded-lg">
                    <h3 class="text-lg font-bold mb-4">История заявок</h3>
                    <div class="activity-log space-y-3">${requestsHtml}</div>
                 </div>
            </div>
        </div>
    `;
}

/**
 * Отрисовывает форму создания нового клиента.
 * @param {HTMLElement} container - Контейнер для рендеринга.
 * @param {object} data - Объект с данными приложения.
 */
export function renderCreateClientPage(container, data) {
    container.innerHTML = `
        <form data-action="create" data-entity="client" class="space-y-4 max-w-lg mx-auto">
            <h2 class="text-xl font-bold">Новый клиент</h2>
            <div>
                <label for="client-company-name" class="block text-sm font-medium text-gray-300">Название компании</label>
                <input type="text" id="client-company-name" name="companyName" required class="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white">
            </div>
            <div>
                <label for="client-contact-person" class="block text-sm font-medium text-gray-300">Контактное лицо</label>
                <input type="text" id="client-contact-person" name="contactPerson" class="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white">
            </div>
            <div>
                <label for="client-contacts" class="block text-sm font-medium text-gray-300">Контакты (телефон, email)</label>
                <input type="text" id="client-contacts" name="contacts" class="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white">
            </div>
            <div>
                <label for="client-status" class="block text-sm font-medium text-gray-300">Статус</label>
                <select id="client-status" name="status" class="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white">
                    ${data.clientStatuses.map(status => `<option value="${status}">${status}</option>`).join('')}
                </select>
            </div>
            <button type="submit" class="primary-btn">Создать клиента</button>
        </form>
    `;
}