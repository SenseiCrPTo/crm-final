import { data, loadData, createDepartment, createEmployee, createClient, createRequest, updateClient, updateEmployee, updateRequest } from './js/data-manager.js';
import { renderPage, closePopup } from './js/ui-renderer.js';

let currentPage = 'dashboard';
let currentFilters = {};

/**
 * Перезагружает данные с сервера и перерисовывает текущую страницу.
 * Это центральная функция для обновления интерфейса.
 */
async function reloadAndRender() {
    try {
        await loadData();
        renderPage(currentPage, currentFilters);
    } catch (error) {
        console.error("Не удалось перезагрузить и отобразить данные:", error);
        // Здесь можно показать пользователю уведомление об ошибке
    }
}

/**
 * Обрабатывает отправку всех форм создания сущностей (отдел, клиент и т.д.).
 */
async function handleCreateFormSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const formData = Object.fromEntries(new FormData(form).entries());
    const entityType = form.dataset.entity;

    // Преобразуем строковые ID в числа, где это необходимо
    if (formData.parentId) formData.parentId = parseInt(formData.parentId, 10) || null;
    if (formData.departmentId) formData.departmentId = parseInt(formData.departmentId, 10);
    
    try {
        let action;
        switch (entityType) {
            case 'department':
                action = createDepartment(formData);
                currentPage = 'departments';
                break;
            case 'employee':
                action = createEmployee(formData);
                currentPage = 'employees';
                break;
            case 'client':
                action = createClient(formData);
                currentPage = 'clients';
                break;
            case 'request':
                 // Если выбран "новый клиент", сначала создаем его
                if (formData.clientId === 'new') {
                    const newClient = await createClient({ 
                        companyName: formData.newClientCompanyName, 
                        contactPerson: formData.newClientContactPerson,
                        contacts: formData.newClientContacts,
                        status: 'Лид' 
                    });
                    formData.clientId = newClient.id; // Используем ID нового клиента
                }
                
                // Преобразуем числовые поля
                formData.clientId = parseInt(formData.clientId, 10);
                formData.managerId = parseInt(formData.managerId, 10);
                formData.engineerId = parseInt(formData.engineerId, 10);
                formData.amount = parseFloat(formData.amount) || 0;

                // Добавляем запись в лог активности
                formData.activityLog = [{
                    timestamp: new Date().toISOString(),
                    user: "Система",
                    action: `Заявка создана. Статус: ${formData.status}.`
                }];
                action = createRequest(formData);
                currentPage = 'requests';
                break;
            default:
                throw new Error(`Неизвестный тип сущности: ${entityType}`);
        }

        await action; // Выполняем действие (создание)
        
        closePopup();
        await reloadAndRender(); // Перезагружаем и перерисовываем

    } catch (error) {
        console.error(`Ошибка при создании ${entityType}:`, error);
    }
}

/**
 * Обрабатывает навигацию по боковой панели.
 */
function handleNavigation(event) {
    const link = event.target.closest('a');
    if (link && link.dataset.page) {
        event.preventDefault();
        currentPage = link.dataset.page;
        currentFilters = {}; // Сбрасываем фильтры
        renderPage(currentPage, currentFilters);
    }
}

/**
 * Инициализирует приложение, загружает данные и устанавливает обработчики событий.
 */
async function init() {
    // Глобальные функции для вызова из HTML
    window.openRequestDetails = (requestId) => {
        currentPage = 'edit-request';
        renderPage(currentPage, { requestId });
    };

    // Устанавливаем единый обработчик на все формы создания
    document.addEventListener('submit', (event) => {
        if (event.target.hasAttribute('data-entity')) {
            handleCreateFormSubmit(event);
        }
    });

    // Обработчик навигации
    document.querySelector('.sidebar').addEventListener('click', handleNavigation);
    
    // Первоначальная загрузка и отрисовка дашборда
    currentPage = 'dashboard';
    await reloadAndRender();
}

document.addEventListener('DOMContentLoaded', init);