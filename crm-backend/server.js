require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');
const { startBot } = require('./bot.js');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
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

// ==================================================================
// ## 1. API ROUTES ##
// All API-related routes are defined first to ensure they are matched
// before the static file server or the catch-all route.
// ==================================================================

// GET (Get Lists)
app.get('/api/:resource', async (req, res) => {
    const { resource } = req.params;
    const validResources = ['departments', 'employees', 'clients', 'requests'];
    if (!validResources.includes(resource)) {
        return res.status(404).json({ error: 'Resource not found' });
    }
    try {
        const result = await pool.query(`SELECT * FROM ${resource} ORDER BY id ASC`);
        res.json(toCamelCase(result.rows));
    } catch (error) {
        console.error(`Error on GET request to ${resource}:`, error);
        res.status(500).json({ error: error.message });
    }
});

// POST (Create)
app.post('/api/departments', async (req, res) => {
    try {
        const { name, parentId = null } = req.body;
        const result = await pool.query('INSERT INTO departments (name, parent_id) VALUES ($1, $2) RETURNING *', [name, parentId]);
        res.status(201).json(toCamelCase(result.rows)[0]);
    } catch (error) {
        console.error("Error creating department:", error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/employees', async (req, res) => {
    try {
        const { name, role, departmentId = null } = req.body;
        const result = await pool.query('INSERT INTO employees (name, role, department_id) VALUES ($1, $2, $3) RETURNING *', [name, role, departmentId]);
        res.status(201).json(toCamelCase(result.rows)[0]);
    } catch (error) {
        console.error("Error creating employee:", error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/clients', async (req, res) => {
    try {
        const { companyName, contactPerson, contacts = null, region = null, city = null, status = 'Лид' } = req.body;
        const result = await pool.query('INSERT INTO clients (company_name, contact_person, contacts, region, city, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *', [companyName, contactPerson, contacts, region, city, status]);
        res.status(201).json(toCamelCase(result.rows)[0]);
    } catch (error) {
        console.error("Error creating client:", error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/requests', async (req, res) => {
    try {
        const { clientId, managerId = null, engineerId = null, city, address, amount = null, cost = null, deadline = null, info = null, status } = req.body;
        const result = await pool.query(
            `INSERT INTO requests (client_id, manager_id, engineer_id, city, address, amount, cost, deadline, info, status, comments, tasks, attachments, activity_log)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, '[]', '[]', '[]', '[]') RETURNING *`,
            [ clientId, managerId, engineerId, city, address, amount, cost, deadline, info, status ]
        );
        res.status(201).json(toCamelCase(result.rows)[0]);
    } catch (error) {
        console.error("Error creating request:", error);
        res.status(500).json({ error: error.message });
    }
});

// PATCH (Update)
app.patch('/api/:resource/:id', async (req, res) => {
    const { resource, id } = req.params;
    const validResources = ['clients', 'employees', 'requests', 'departments'];
    if (!validResources.includes(resource)) {
        return res.status(404).json({ error: 'Resource not found' });
    }
    try {
        const fields = [];
        const values = [];
        let queryCounter = 1;

        for (const key in req.body) {
            if (key === 'id') continue;
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
            return res.status(400).json({ error: 'No fields to update' });
        }

        values.push(id);
        const query = `UPDATE ${resource} SET ${fields.join(', ')} WHERE id = $${queryCounter} RETURNING *`;

        const result = await pool.query(query, values);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Record not found' });
        }
        res.json(toCamelCase(result.rows)[0]);
    } catch (error) {
        console.error(`Error updating ${resource}:`, error);
        res.status(500).json({ error: error.message });
    }
});


// ==================================================================
// ## 2. STATIC FILE SERVING ##
// !! ИЗМЕНЕНИЕ ЗДЕСЬ !!
// The path now points to 'public' to match the server's expectation.
// ==================================================================
const publicPath = path.join(__dirname, '..', 'public');
app.use(express.static(publicPath));


// ==================================================================
// ## 3. SPA CATCH-ALL ROUTE ##
// This handles all other GET requests by sending the main index.html file.
// ==================================================================
app.get('*', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
});


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server is running successfully on port ${PORT}`);
});

// Start the bot
startBot();