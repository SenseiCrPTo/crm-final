// js/pages/employees.js

/**
 * Отрисовывает страницу со списком отделов и сотрудников.
 * @param {HTMLElement} container - Контейнер для рендеринга.
 * @param {object} data - Объект с данными приложения.
 */
export function renderEmployeeListPage(container, data) {
    if (!data.employees || data.employees.length === 0) {
        container.innerHTML = '<p class="text-gray-400 text-center">Сотрудники не найдены.</p>';
        return;
    }
    
    // Группируем сотрудников по отделам
    const employeesByDepartment = data.departments.map(dep => ({
        ...dep,
        employees: data.employees.filter(emp => emp.departmentId === dep.id)
    }));

    const unassignedEmployees = data.employees.filter(emp => !emp.departmentId);

    let html = employeesByDepartment.map(dep => `
        <div class="bg-gray-800 rounded-lg p-4">
            <h3 class="font-bold text-lg text-red-500 mb-3">${dep.name}</h3>
            <div class="space-y-2">
                ${dep.employees.length > 0 ? dep.employees.map(emp => `
                    <div class="flex justify-between items-center p-2 rounded-md hover:bg-gray-700 cursor-pointer" data-action="details" data-entity="employee" data-id="${emp.id}">
                        <span>${emp.name}</span>
                        <span class="text-sm text-gray-400">${emp.role}</span>
                    </div>
                `).join('') : '<p class="text-sm text-gray-500">Сотрудников нет</p>'}
            </div>
        </div>
    `).join('');

    if (unassignedEmployees.length > 0) {
        html += `
             <div class="bg-gray-800 rounded-lg p-4 mt-4">
                <h3 class="font-bold text-lg text-gray-400 mb-3">Без отдела</h3>
                <div class="space-y-2">
                    ${unassignedEmployees.map(emp => `
                        <div class="flex justify-between items-center p-2 rounded-md hover:bg-gray-700 cursor-pointer" data-action="details" data-entity="employee" data-id="${emp.id}">
                            <span>${emp.name}</span>
                            <span class="text-sm text-gray-400">${emp.role}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    container.innerHTML = `<div class="space-y-4">${html}</div>`;
}

/**
 * Отрисовывает страницу с детальной информацией о сотруднике.
 * @param {HTMLElement} container - Контейнер для рендеринга.
 * @param {number} employeeId - ID сотрудника.
 * @param {object} data - Объект с данными приложения.
 */
export function renderEmployeeDetailsPage(container, employeeId, data) {
     const employee = data.employees.find(e => e.id == employeeId);
    if (!employee) { container.innerHTML = '<h2>Сотрудник не найден</h2>'; return; }

    document.getElementById('page-title').textContent = employee.name;
    
    const departmentOptions = data.departments.map(dep => `<option value="${dep.id}" ${dep.id === employee.departmentId ? 'selected' : ''}>${dep.name}</option>`).join('');

    container.innerHTML = `
        <form data-action="edit" data-entity="employee" class="space-y-4 max-w-lg mx-auto">
            <input type="hidden" name="id" value="${employee.id}">
            <h2 class="text-xl font-bold">Редактирование сотрудника</h2>
            <div>
                <label class="block text-sm font-medium text-gray-300">ФИО</label>
                <input type="text" name="name" value="${employee.name}" required class="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-300">Должность</label>
                <input type="text" name="role" value="${employee.role}" required class="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-300">Отдел</label>
                <select name="departmentId" class="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white">
                    <option value="">-- Без отдела --</option>
                    ${departmentOptions}
                </select>
            </div>
            <button type="submit" class="primary-btn">Сохранить</button>
        </form>
    `;
}

/**
 * Отрисовывает форму создания нового отдела.
 * @param {HTMLElement} container - Контейнер для рендеринга.
 * @param {object} data - Объект с данными приложения.
 */
export function renderCreateDepartmentPage(container, data) {
    const parentOptions = data.departments.map(dep => `<option value="${dep.id}">${dep.name}</option>`).join('');
    container.innerHTML = `
        <form data-action="create" data-entity="department" class="space-y-4 max-w-lg mx-auto">
            <h2 class="text-xl font-bold">Создание отдела</h2>
            <div>
                <label for="department-name" class="block text-sm font-medium text-gray-300">Название отдела</label>
                <input type="text" id="department-name" name="name" required class="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white">
            </div>
            <div>
                <label for="parent-department" class="block text-sm font-medium text-gray-300">Родительский отдел (необязательно)</label>
                <select id="parent-department" name="parentId" class="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white">
                    <option value="">-- Корневой отдел --</option>
                    ${parentOptions}
                </select>
            </div>
            <button type="submit" class="primary-btn">Создать отдел</button>
        </form>
    `;
}

/**
 * Отрисовывает форму добавления нового сотрудника.
 * @param {HTMLElement} container - Контейнер для рендеринга.
 * @param {object} data - Объект с данными приложения.
 */
export function renderCreateEmployeePage(container, data) {
    const departmentOptions = data.departments.map(dep => `<option value="${dep.id}">${dep.name}</option>`).join('');
    container.innerHTML = `
        <form data-action="create" data-entity="employee" class="space-y-4 max-w-lg mx-auto">
            <h2 class="text-xl font-bold">Добавление сотрудника</h2>
            <div>
                <label for="employee-name" class="block text-sm font-medium text-gray-300">ФИО</label>
                <input type="text" id="employee-name" name="name" required class="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white">
            </div>
             <div>
                <label for="employee-role" class="block text-sm font-medium text-gray-300">Должность</label>
                <input type="text" id="employee-role" name="role" required class="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white">
            </div>
            <div>
                <label for="employee-department" class="block text-sm font-medium text-gray-300">Отдел</label>
                <select id="employee-department" name="departmentId" class="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white">
                    <option value="">-- Без отдела --</option>
                    ${departmentOptions}
                </select>
            </div>
            <button type="submit" class="primary-btn">Добавить сотрудника</button>
        </form>
    `;
}