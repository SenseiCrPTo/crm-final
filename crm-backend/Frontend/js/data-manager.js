const API_BASE_URL = '/api'; // ИЗМЕНЕНИЕ ЗДЕСЬ

export const data = {
    requests: [],
    departments: [],
    employees: [],
    clients: [],
    clientStatuses: ['Лид', 'Новый клиент', 'Повторное обращение', 'Постоянный клиент', 'Закрытый клиент', 'Черный список'],
    cgmStages: ['Новая заявка', 'В работе у менеджера', 'В работе у инженера', 'Создание КП', 'У клиента', 'Сделка', 'Сделка проиграна', 'Исполнение сделки', 'Контракт завершен', 'Ожидание оплаты', 'Оплата получена', 'Завершена']
};

export async function loadData() {
    try {
        const [requestsRes, departmentsRes, employeesRes, clientsRes] = await Promise.all([
            fetch(`${API_BASE_URL}/requests`),
            fetch(`${API_BASE_URL}/departments`),
            fetch(`${API_BASE_URL}/employees`),
            fetch(`${API_BASE_URL}/clients`)
        ]);
        data.requests = await requestsRes.json();
        data.departments = await departmentsRes.json();
        data.employees = await employeesRes.json();
        data.clients = await clientsRes.json();
    } catch (error) {
        console.error('Ошибка при загрузке данных с сервера:', error);
    }
}

async function apiCall(endpoint, method = 'GET', body = null) {
    try {
        const options = {
            method,
            headers: { 'Content-Type': 'application/json' }
        };
        if (body) {
            options.body = JSON.stringify(body);
        }
        const response = await fetch(`${API_BASE_URL}/${endpoint}`, options);
        if (!response.ok) {
            const errorBody = await response.json();
            throw new Error(errorBody.error || `HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Ошибка при запросе к ${endpoint}:`, error);
        throw error;
    }
}

// Функции создания
export const createDepartment = (data) => apiCall('departments', 'POST', data);
export const createEmployee = (data) => apiCall('employees', 'POST', data);
export const createClient = (data) => apiCall('clients', 'POST', data);
export const createRequest = (data) => apiCall('requests', 'POST', data);

// Функции обновления
export const updateClient = (id, data) => apiCall(`clients/${id}`, 'PATCH', data);
export const updateEmployee = (id, data) => apiCall(`employees/${id}`, 'PATCH', data);
export const updateRequest = (id, data) => apiCall(`requests/${id}`, 'PATCH', data);