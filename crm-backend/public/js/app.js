import * as api from './data-manager.js';
import { renderPage, initNavigation } from './ui-renderer.js';

let currentPage = 'dashboard';
let currentContextId = null;

async function reloadAndRender() {
    await api.loadData();
    renderPage(currentPage, currentContextId);
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
        } else if (formData[key] === '') {
            delete formData[key];
        }
    }

    try {
        if (action === 'create') {
            await handleCreate(entity, formData);
        } else if (action === 'edit') {
            await handleEdit(entity, formData);
        }
        await reloadAndRender();
    } catch (error) {
        console.error(`Ошибка при действии '${action}' для '${entity}':`, error);
        alert('Произошла ошибка. Пожалуйста, проверьте консоль.');
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
    currentContextId = null;
}

async function handleEdit(entity, formData) {
    const id = parseInt(formData.id, 10);
    delete formData.id;

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
    const link = target.closest('a[data-page], button[data-action], div[data-action]');

    if (!link) return;

    const { page, action, entity, id } = link.dataset;

    if (page) {
        event.preventDefault();
        currentPage = page;
        currentContextId = null;
        renderPage(currentPage, currentContextId);
    } else if (action) {
        event.preventDefault();
        if (action === 'create') {
            currentPage = `create-${entity}`;
            currentContextId = null;
        } else if (action === 'details') {
            currentPage = `${entity}-details`;
            currentContextId = parseInt(id, 10);
        }
        renderPage(currentPage, currentContextId);
    }
}

async function init() {
    // Make the reload function globally available for Sortable.js
    window.reloadAndRender = reloadAndRender;
    
    initNavigation();
    
    const menuButton = document.getElementById('menu-button');
    const closeMenuButton = document.getElementById('close-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');

    function toggleMenu() {
        mobileMenu.classList.toggle('hidden');
    }

    menuButton.addEventListener('click', toggleMenu);
    closeMenuButton.addEventListener('click', toggleMenu);
    
    document.addEventListener('submit', handleFormSubmit);
    document.addEventListener('click', handleGlobalClick);
    
    await reloadAndRender();
}

document.addEventListener('DOMContentLoaded', init);