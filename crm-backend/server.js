require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// --- ИЗМЕНЕНИЕ ЗДЕСЬ ---
// Путь теперь прямой, так как папка Frontend находится внутри crm-backend
app.use(express.static(path.join(__dirname, 'Frontend')));
// --- КОНЕЦ ИЗМЕНЕНИЯ ---


const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const toCamelCase = (rows) => {
    return rows.map(row => {
        const newRow = {};
        for (let key in row) {
            const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
            newRow[camelKey] = row[key];
        }
        return newRow;
    });
};

// --- API МАРШРУТЫ ---

// GET (Получить списки)
app.get('/api/:resource', async (req, res) => {
    const { resource } = req.params;
    const validResources = ['departments', 'employees', 'clients', 'requests'];
    if (!validResources.includes(resource)) {
        return res.status(404).json({ error: 'Ресурс не найден' });
    }
    try {
        const result = await pool.query(`SELECT * FROM ${resource}`);
        res.json(toCamelCase(result.rows));
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// POST (Создать)
app.post('/api/departments', async (req, res) => {
    try {
        const { name, parentId } = req.body;
        const result = await pool.query('INSERT INTO departments (name, parent_id) VALUES ($1, $2) RETURNING *', [name, parentId]);
        res.status(201).json(toCamelCase(result.rows)[0]);
    } catch (error) { res.status(500).json({ error: error.message }); }
});
app.post('/api/employees', async (req, res) => {
    try {
        const { name, role, departmentId } = req.body;
        const result = await pool.query('INSERT INTO employees (name, role, department_id) VALUES ($1, $2, $3) RETURNING *', [name, role, departmentId]);
        res.status(201).json(toCamelCase(result.rows)[0]);
    } catch (error) { res.status(500).json({ error: error.message }); }
});
app.post('/api/clients', async (req, res) => {
    try {
        const { companyName, contactPerson, contacts, region, city, status } = req.body;
        const result = await pool.query('INSERT INTO clients (company_name, contact_person, contacts, region, city, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *', [companyName, contactPerson, contacts, region, city, status]);
        res.status(201).json(toCamelCase(result.rows)[0]);
    } catch (error) { res.status(500).json({ error: error.message }); }
});
app.post('/api/requests', async (req, res) => {
    try {
        const { clientId, managerId, engineerId, city, address, amount, cost, deadline, info, status, activityLog } = req.body;
        const result = await pool.query(
            `INSERT INTO requests (client_id, manager_id, engineer_id, city, address, amount, cost, deadline, info, status, comments, tasks, attachments, activity_log)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
            [ clientId, managerId, engineerId, city, address, amount, cost, deadline || null, info, status, JSON.stringify(req.body.comments || []), JSON.stringify(req.body.tasks || []), JSON.stringify(req.body.attachments || []), JSON.stringify(activityLog || []) ]
        );
        res.status(201).json(toCamelCase(result.rows)[0]);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// PATCH (Обновить)
app.patch('/api/:resource/:id', async (req, res) => {
    const { resource, id } = req.params;
    const validResources = ['clients', 'employees', 'requests', 'departments'];
    if (!validResources.includes(resource)) {
        return res.status(404).json({ error: 'Ресурс не найден' });
    }
    try {
        const fields = [];
        const values = [];
        let queryCounter = 1;
        
        for (const key in req.body) {
            const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
            fields.push(`${snakeKey} = $${queryCounter++}`);
            
            if (['comments', 'tasks', 'attachments', 'activityLog'].includes(key)) {
                values.push(JSON.stringify(req.body[key]));
            } else if (key === 'deadline' && req.body[key] === '') {
                values.push(null);
            } else {
                values.push(req.body[key]);
            }
        }

        if (fields.length === 0) {
            return res.status(400).json({ error: 'Нет полей для обновления' });
        }
        
        values.push(id);
        const query = `UPDATE ${resource} SET ${fields.join(', ')} WHERE id = $${queryCounter} RETURNING *`;
        
        const result = await pool.query(query, values);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Запись не найдена' });
        }
        res.json(toCamelCase(result.rows)[0]);
    } catch (error) { 
        console.error(`Ошибка при обновлении ${resource}:`, error);
        res.status(500).json({ error: error.message }); 
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Сервер успешно запущен на порту ${PORT}`);
});