export function renderDashboard(container, data) {
    // =======================================================
    // ИЗМЕНЕНИЕ ЗДЕСЬ: Считаем только успешные сделки
    // =======================================================
    const successfulDealStatuses = ['Исполнение сделки', 'Контракт завершен', 'Ожидание оплаты', 'Оплата получена', 'Завершена'];
    const deals = data.requests.filter(r => successfulDealStatuses.includes(r.status));
    
    const totalAmount = deals.reduce((sum, deal) => sum + (Number(deal.amount) || 0), 0);
    const totalCost = deals.reduce((sum, deal) => sum + (Number(deal.cost) || 0), 0);
    const totalProfit = totalAmount - totalCost;
    const clientCount = data.clients.length;
    const currentUser = data.employees[0] || { name: 'Текущий пользователь' };
    const myActiveRequests = data.requests.filter(r => !successfulDealStatuses.includes(r.status) && r.status !== 'Сделка проиграна').slice(0, 3);

    container.className = 'grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6';

    container.innerHTML = `
        <div class="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
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
        </div>
        <div class="md:col-span-2 bg-gray-800 rounded-2xl p-6 shadow-lg">
            <h2 class="text-xl font-bold text-gray-100 mb-4">Мои активные заявки (${currentUser.name})</h2>
            <div class="space-y-4">
                ${myActiveRequests.length > 0 ? myActiveRequests.map(req => {
                    const client = data.clients.find(c => c.id === req.clientId) || {};
                    return `
                        <div class="p-3 rounded-lg hover:bg-gray-700 cursor-pointer" data-action="details" data-entity="request" data-id="${req.id}">
                            <h3 class="text-lg font-semibold text-gray-100">Заявка #${req.id}</h3>
                            <p class="text-sm text-gray-400 mt-1">${client.companyName || 'Клиент'} · ${req.status}</p>
                        </div>
                    `;
                }).join('') : '<p class="text-gray-400">Активных заявок нет.</p>'}
            </div>
        </div>
    `;
}