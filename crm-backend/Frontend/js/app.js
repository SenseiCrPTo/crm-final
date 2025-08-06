import { data, loadData, createDepartment, createEmployee, createClient, createRequest, updateClient, updateEmployee, updateRequest } from './data-manager.js';
import { renderPage } from './ui-renderer.js';

function generateDoc(request, client) {
    const htmlContent = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head><meta charset='utf-8'><title>Коммерческое предложение</title></head>
        <body>
            <div style="font-family: Arial, sans-serif; font-size: 12pt;">
                <h1 style="text-align: center;">Коммерческое предложение</h1>
                <p><b>Дата:</b> ${new Date().toLocaleDateString()}</p>
                <p><b>Для компании:</b> ${client.companyName}</p>
                <p><b>Контактное лицо:</b> ${client.contactPerson || ''}</p>
                <br>
                <h3>Предмет предложения:</h3>
                <p>${request.info || 'Общие работы по заявке'}</p>
                <br><br>
                <h2 style="color: #333;">Итоговая сумма: ${request.amount.toLocaleString()} руб.</h2>
            </div>
        </body>
        </html>
    `;
    const dataUri = 'data:application/msword;charset=utf-8,' + encodeURIComponent(htmlContent);
    const link = document.createElement('a');
    link.href = dataUri;
    link.download = `Commercial_Proposal_${client.companyName}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

async function init() {
    window.openRequestDetails = (requestId) => renderPage('edit-request', requestId);
    window.updateRequestStatus = async (requestId, newStatus) => {
        await updateRequest(requestId, { status: newStatus });
        await loadData();
        renderPage('requests');
    };
    window.openClientDetails = (clientId) => renderPage('client-details', clientId);
    window.openEmployeeDetails = (employeeId) => renderPage('employee-details', employeeId);
    window.updateClientStatus = async (clientId, newStatus) => {
        await updateClient(clientId, { status: newStatus });
        await loadData();
        renderPage('client-details', clientId);
    };

    document.querySelector('.sidebar').addEventListener('click', (e) => {
        if (e.target.matches('.nav-item')) { e.preventDefault(); renderPage(e.target.dataset.page); }
    });

    document.getElementById('header-buttons').addEventListener('click', (e) => {
        const action = e.target.id;
        if (action === 'go-to-create-client') renderPage('create-client');
        if (action === 'go-to-create-department') renderPage('create-department');
        if (action === 'go-to-create-employee') renderPage('create-employee');
        if (action === 'go-to-create-request') renderPage('create-request');
    });

    document.addEventListener('click', async (e) => {
        if (e.target.matches('.task-item input[type="checkbox"]')) {
            const requestId = parseInt(document.querySelector('#edit-request-id').value);
            const request = data.requests.find(r => r.id == requestId);
            const taskIndex = parseInt(e.target.dataset.taskIndex);
            if (request && request.tasks[taskIndex] !== undefined) {
                const updatedTasks = JSON.parse(JSON.stringify(request.tasks));
                updatedTasks[taskIndex].completed = e.target.checked;
                await updateRequest(requestId, { tasks: updatedTasks });
                await loadData();
                renderPage('edit-request', requestId);
            }
        }
    });

    document.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        switch (e.target.id) {
            case 'edit-request-form': {
                const form = e.target;
                const requestId = parseInt(form.querySelector('#edit-request-id').value);
                await updateRequest(requestId, {
                    clientId: parseInt(form.querySelector('#edit-request-client').value),
                    city: form.querySelector('#edit-request-city').value,
                    address: form.querySelector('#edit-request-address').value,
                    deadline: form.querySelector('#edit-request-deadline').value,
                    info: form.querySelector('#edit-request-info').value,
                    managerId: parseInt(form.querySelector('#edit-request-manager').value),
                    engineerId: parseInt(form.querySelector('#edit-request-engineer').value),
                    amount: parseFloat(form.querySelector('#edit-request-amount').value),
                    cost: parseFloat(form.querySelector('#edit-request-cost').value)
                });
                await loadData();
                renderPage('edit-request', requestId);
                break;
            }
            case 'edit-client-form': {
                const clientId = parseInt(e.target.querySelector('#edit-client-id').value);
                await updateClient(clientId, {
                    companyName: e.target.querySelector('#edit-client-company-name').value,
                    contactPerson: e.target.querySelector('#edit-client-contact-person').value,
                    contacts: e.target.querySelector('#edit-client-contacts').value,
                    region: e.target.querySelector('#edit-client-region').value
                });
                await loadData();
                renderPage('client-details', clientId);
                break;
            }
            case 'edit-employee-form': {
                const employeeId = parseInt(e.target.querySelector('#edit-employee-id').value);
                await updateEmployee(employeeId, {
                    name: e.target.querySelector('#edit-employee-name').value,
                    role: e.target.querySelector('#edit-employee-role').value,
                    departmentId: parseInt(e.target.querySelector('#edit-employee-department').value)
                });
                await loadData();
                renderPage('employee-details', employeeId);
                break;
            }
            case 'add-comment-form': {
                const requestId = parseInt(document.querySelector('#edit-request-id').value);
                const request = data.requests.find(r => r.id == requestId);
                const text = e.target.querySelector('textarea[name="comment-text"]').value;
                const authorId = data.employees[0]?.id || 0;
                const newComment = { authorId, text, timestamp: new Date() };
                const updatedComments = [...request.comments, newComment];
                await updateRequest(requestId, { comments: updatedComments });
                await loadData();
                renderPage('edit-request', requestId);
                break;
            }
            case 'add-task-form': {
                const requestId = parseInt(document.querySelector('#edit-request-id').value);
                const request = data.requests.find(r => r.id == requestId);
                const text = e.target.querySelector('input[name="task-text"]').value;
                const newTask = { text, completed: false };
                const updatedTasks = [...request.tasks, newTask];
                await updateRequest(requestId, { tasks: updatedTasks });
                await loadData();
                renderPage('edit-request', requestId);
                break;
            }
            case 'department-form': {
                const form = e.target;
                const parentIdValue = form.querySelector('#parent-department').value;
                await createDepartment({ name: form.querySelector('#department-name').value, parentId: parentIdValue !== 'null' ? parseInt(parentIdValue) : null });
                await loadData();
                renderPage('departments');
                break;
            }
            case 'employee-form': {
                const form = e.target;
                await createEmployee({ name: form.querySelector('#employee-name').value, role: form.querySelector('#employee-role').value, departmentId: parseInt(form.querySelector('#employee-department').value) });
                await loadData();
                renderPage('departments');
                break;
            }
            case 'client-form': {
                const form = e.target;
                await createClient({ companyName: form.querySelector('#client-company-name').value, contactPerson: form.querySelector('#client-contact-person').value, contacts: form.querySelector('#client-contacts').value, region: form.querySelector('#client-region').value, city: form.querySelector('#client-city').value, status: form.querySelector('#client-status').value });
                await loadData();
                renderPage('clients');
                break;
            }
             case 'request-form': {
                const form = e.target;
                let clientId;
                if (form.querySelector('#request-client').value === 'new') {
                    const newClient = await createClient({ companyName: form.querySelector('#new-client-company-name').value, contactPerson: form.querySelector('#new-client-contact-person').value, status: 'Новый клиент' });
                    clientId = newClient.id;
                } else {
                    clientId = parseInt(form.querySelector('#request-client').value);
                }
                await createRequest({ clientId: clientId, managerId: parseInt(form.querySelector('#request-manager').value), engineerId: parseInt(form.querySelector('#request-engineer').value), city: form.querySelector('#request-city').value, address: form.querySelector('#request-address').value, amount: parseFloat(form.querySelector('#request-amount').value), cost: 0, deadline: form.querySelector('#request-deadline').value, info: form.querySelector('#request-info').value, status: data.cgmStages[0], activityLog: [{ type: 'status_change', timestamp: new Date(), text: `Заявка создана в статусе "${data.cgmStages[0]}"` }] });
                await loadData();
                renderPage('requests');
                break;
            }
        }
    });

    await loadData();
    renderPage('dashboard');
}

init();