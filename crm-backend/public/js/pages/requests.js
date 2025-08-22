import * as api from '../data-manager.js';

/**
 * Renders the requests page as a responsive Kanban board.
 * @param {HTMLElement} container - The container element for rendering.
 * @param {object} data - The application's data object.
 */
export function renderRequestsPage(container, data) {
    // Use CSS Grid for a responsive layout.
    // Columns will stack on mobile and form a grid on larger screens.
    container.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'; 
    
    data.cgmStages.forEach(stageName => {
        const column = document.createElement('div');
        // Styles for the column
        column.className = 'bg-gray-900 rounded-xl p-4 flex flex-col';
        
        const requestsForStage = data.requests.filter(req => req.status === stageName);
        
        let cardsHtml = requestsForStage.map(req => {
            const client = data.clients.find(c => c.id === req.clientId) || {};
            return `
                <div class="bg-gray-800 rounded-lg p-4 cursor-pointer hover:bg-gray-700" 
                     data-action="details" data-entity="request" data-id="${req.id}">
                    <h4 class="font-semibold text-gray-100">${client.companyName || 'Unknown Client'}</h4>
                    <p class="text-sm text-gray-400 mt-1">${Number(req.amount || 0).toLocaleString()} ₸</p>
                </div>
            `;
        }).join('');

        if (requestsForStage.length === 0) {
            cardsHtml = '<p class="text-sm text-gray-500 text-center mt-4">Empty</p>';
        }

        column.innerHTML = `
            <h3 class="font-bold text-gray-100 text-center mb-3">${stageName}</h3>
            <div class="kanban-cards space-y-3" data-status="${stageName}">${cardsHtml}</div>
        `;
        container.appendChild(column);
    });

    const kanbanColumns = container.querySelectorAll('.kanban-cards');
    kanbanColumns.forEach(column => {
        new Sortable(column, {
            group: 'requests',
            animation: 150,
            onEnd: async (evt) => {
                const requestId = parseInt(evt.item.dataset.id, 10);
                const newStatus = evt.to.dataset.status;
                try {
                    await api.updateRequest(requestId, { status: newStatus });
                    // UPDATE: Force a full re-render for UI stability
                    if (window.reloadAndRender) {
                        await window.reloadAndRender();
                    }
                } catch (error) {
                    console.error("Error updating request status:", error);
                }
            }
        });
    });
}

/**
 * Renders the form for creating a new request.
 * @param {HTMLElement} container - The container element for rendering.
 * @param {object} data - The application's data object.
 */
export function renderCreateRequestPage(container, data) {
    const clientOptions = data.clients.map(c => `<option value="${c.id}">${c.companyName}</option>`).join('');
    const employeeOptions = data.employees.map(emp => `<option value="${emp.id}">${emp.name} (${emp.role})</option>`).join('');

    container.innerHTML = `
        <form data-action="create" data-entity="request" class="space-y-4 max-w-lg mx-auto">
            <h2 class="text-xl font-bold">New Request</h2>
            
            <div>
                <label for="request-client" class="block text-sm font-medium text-gray-300">Client</label>
                <select id="request-client" name="clientId" class="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-red-500 focus:ring-red-500" required>
                    <option value="">-- Select a client --</option>
                    <option value="new">-- Create new --</option>
                    ${clientOptions}
                </select>
            </div>
            
            <div id="new-client-fields" class="hidden space-y-4 border-l-2 border-red-500 pl-4">
                <p class="text-sm font-bold text-gray-200">New Client Details</p>
                <div>
                    <label for="new-client-company-name" class="block text-sm font-medium text-gray-300">Company Name</label>
                    <input type="text" id="new-client-company-name" name="newClientCompanyName" class="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm">
                </div>
                <div>
                    <label for="new-client-contact-person" class="block text-sm font-medium text-gray-300">Contact Person</label>
                    <input type="text" id="new-client-contact-person" name="newClientContactPerson" class="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm">
                </div>
            </div>

            <div>
                <label for="request-info" class="block text-sm font-medium text-gray-300">Request Information</label>
                <textarea id="request-info" name="info" rows="4" required class="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm"></textarea>
            </div>

             <div>
                <label for="request-manager" class="block text-sm font-medium text-gray-300">Assigned Manager</label>
                <select id="request-manager" name="managerId" class="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm">
                    <option value="">-- Unassigned --</option>
                    ${employeeOptions}
                </select>
            </div>

            <button type="submit" class="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-md hover:bg-red-700">Create Request</button>
        </form>
    `;

    const clientSelect = container.querySelector('#request-client');
    const newClientFields = container.querySelector('#new-client-fields');
    clientSelect.addEventListener('change', () => {
        const isNew = clientSelect.value === 'new';
        newClientFields.classList.toggle('hidden', !isNew);
        newClientFields.querySelector('#new-client-company-name').required = isNew;
    });
}

/**
 * Renders the page for editing a request.
 * @param {HTMLElement} container - The container element for rendering.
 * @param {number} requestId - The ID of the request.
 * @param {object} data - The application's data object.
 */
export function renderEditRequestPage(container, requestId, data) {
    const request = data.requests.find(r => r.id == requestId);
    if (!request) {
        container.innerHTML = `<p class="text-center text-gray-400">Request not found.</p>`;
        return;
    }

    const client = data.clients.find(c => c.id == request.clientId) || {};
    document.getElementById('page-title').textContent = `Request #${request.id}: ${client.companyName || ''}`;

    const clientOptions = data.clients.map(c => `<option value="${c.id}" ${c.id == request.clientId ? 'selected' : ''}>${c.companyName}</option>`).join('');
    const employeeOptions = data.employees.map(emp => `<option value="${emp.id}">${emp.name}</option>`).join('');
    
    container.innerHTML = `
        <form data-action="edit" data-entity="request" class="space-y-6 max-w-2xl mx-auto">
            <input type="hidden" name="id" value="${request.id}">

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label class="block text-sm font-medium text-gray-300">Client</label>
                    <select name="clientId" required class="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white">${clientOptions}</select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-300">Status</label>
                    <select name="status" required class="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white">
                        ${data.cgmStages.map(s => `<option value="${s}" ${s === request.status ? 'selected' : ''}>${s}</option>`).join('')}
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-300">City</label>
                    <input type="text" name="city" value="${request.city || ''}" class="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-300">Address</label>
                    <input type="text" name="address" value="${request.address || ''}" class="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-300">Assigned Manager</label>
                    <select name="managerId" class="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white">
                        <option value="">-- Unassigned --</option>
                        ${data.employees.map(e => `<option value="${e.id}" ${e.id == request.managerId ? 'selected' : ''}>${e.name}</option>`).join('')}
                    </select>
                </div>
                 <div>
                    <label class="block text-sm font-medium text-gray-300">Assigned Engineer</label>
                    <select name="engineerId" class="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white">
                        <option value="">-- Unassigned --</option>
                        ${data.employees.map(e => `<option value="${e.id}" ${e.id == request.engineerId ? 'selected' : ''}>${e.name}</option>`).join('')}
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-300">Contract Price</label>
                    <input type="number" name="amount" value="${request.amount || ''}" class="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-300">Cost</label>
                    <input type="number" name="cost" value="${request.cost || ''}" class="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white">
                </div>
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-300">Additional Information</label>
                <textarea name="info" rows="5" class="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white">${request.info || ''}</textarea>
            </div>
            
            <button type="submit" class="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-md hover:bg-red-700">Save Changes</button>
        </form>
    `;
}