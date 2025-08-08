import * as api from './js/data-manager.js';
import { renderPage, closePopup } from './js/ui-renderer.js';

let currentPage = 'dashboard';
let currentOptions = {};

async function reloadAndRender() {
    await api.loadData();
    renderPage(currentPage, currentOptions);
}

async function handleFormSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const action = form.dataset.action;
    const entity = form.dataset.entity;
    const formData = Object.fromEntries(new FormData(form));

    for (const key in formData) {
        if (key.endsWith('Id') && formData[key]) {
            formData[key] = parseInt(formData[key], 10);
        }
    }

    try {
        if (action === 'create') {
            await handleCreate(entity, formData);
        } else if (action === 'edit') {
            await handleEdit(entity, formData);
        }
        
        closePopup();
        await reloadAndRender();

    } catch (error) {
        console.error(`Ошибка при действии '${action}' для '${entity}':`, error);
        alert('Произошла ошибка.');
    }
}

async function handleCreate(entity, formData) {
    switch (entity) {
        case 'department':
            await api.createDepartment(formData);
            currentPage = 'departments';
            break;
        case 'client':
            await api.createClient(formData);
            currentPage = 'clients';
            break;
        case 'request':
            if (formData.clientId === 'new') {
                const newClient = await api.createClient({
                    companyName: formData.newClientCompanyName,
                    contactPerson: formData.newClientContactPerson,
                    status: 'Лид'
                });
                formData.clientId = newClient.id;
            }
            await api.createRequest(formData);
            currentPage = 'requests';
            break;
        case 'employee':
            await api.createEmployee(formData);
            currentPage = 'departments';
            break;
    }
}

async function handleEdit(entity, formData) {
    const id = parseInt(formData.id);
    switch (entity) {
        case 'client':
            await api.updateClient(id, formData);
            break;
        case 'employee':
            await api.updateEmployee(id, formData);
            break;
        case 'request':
            await api.updateRequest(id, formData);
            break;
    }
}

function handleGlobalClick(event) {
    const target = event.target;
    const link = target.closest('a, button');

    if (!link) return;

    const { action, entity, page, id } = link.dataset;

    if (page) {
        event.preventDefault();
        currentPage = page;
        currentOptions = {};
        renderPage(currentPage, currentOptions);
    } else if (action) {
        event.preventDefault();
        if (action === 'create') {
            currentPage = `create-${entity}`;
            currentOptions = {};
            renderPage(currentPage);
        } else if (action === 'details') {
            currentPage = `${entity}-details`;
            currentOptions = { [`${entity}Id`]: parseInt(id) };
            renderPage(currentPage, currentOptions);
        }
    }
}

async function init() {
    window.updateRequestStatus = async (requestId, newStatus) => {
        try {
            await api.updateRequest(requestId, { status: newStatus });
            await reloadAndRender();
        } catch (error) {
            console.error("Не удалось обновить статус заявки:", error);
        }
    };
    
    document.addEventListener('submit', handleFormSubmit);
    document.addEventListener('click', handleGlobalClick);
    
    await reloadAndRender();
}

document.addEventListener('DOMContentLoaded', init);