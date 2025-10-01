const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { runDb, getDb, allDb } = require('../utils/db-helpers');

// --- Public Route ---
router.get('/public', async (req, res) => {
    try {
        const projectsSql = "SELECT * FROM projects WHERE is_public = TRUE ORDER BY display_order ASC, id ASC";
        const projects = await allDb(projectsSql);

        if (projects.length === 0) return res.json({ data: [] });

        const projectIds = projects.map(p => p.id);
        const placeholders = projectIds.map(() => '?').join(',');
        const attachmentsSql = `SELECT * FROM attachments WHERE is_public = TRUE AND parent_type = 'project' AND parent_id IN (${placeholders})`;
        const attachments = await allDb(attachmentsSql, projectIds);

        const attachmentsByParentId = attachments.reduce((acc, att) => {
            if (!acc[att.parent_id]) acc[att.parent_id] = [];
            acc[att.parent_id].push(att);
            return acc;
        }, {});

        const results = projects.map(proj => ({
            ...proj,
            attachments: attachmentsByParentId[proj.id] || []
        }));

        res.json({ data: results });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch public projects: ' + err.message });
    }
});

// --- Protected Routes ---

// GET all project records (for admin)
router.get('/', authMiddleware, async (req, res) => {
    try {
        const projects = await allDb("SELECT * FROM projects ORDER BY display_order ASC, id ASC");
        res.json({ data: projects });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST a new project record
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { name, description, start_date, end_date, url, is_public } = req.body;

        const row = await getDb("SELECT MAX(display_order) as max_order FROM projects");
        const new_order = (row.max_order || 0) + 1;

        const sql = `INSERT INTO projects (name, description, start_date, end_date, url, is_public, display_order) VALUES (?, ?, ?, ?, ?, ?, ?)`;
        const params = [name, description, start_date, end_date, url, is_public, new_order];
        const result = await runDb(sql, params);

        res.json({ message: "Success", data: { id: result.id, ...req.body, display_order: new_order } });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// PUT (update) a project record by id
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { name, description, start_date, end_date, url, is_public } = req.body;
        const sql = `UPDATE projects SET name = ?, description = ?, start_date = ?, end_date = ?, url = ?, is_public = ? WHERE id = ?`;
        const params = [name, description, start_date, end_date, url, is_public, req.params.id];
        const result = await runDb(sql, params);
        res.json({ message: `Record ${req.params.id} updated`, changes: result.changes });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// DELETE a project record by id
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const result = await runDb('DELETE FROM projects WHERE id = ?', [req.params.id]);
        res.json({ message: "Deleted", changes: result.changes });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// POST to save the new order of all items after a drag-and-drop
router.post('/reorder-all', authMiddleware, async (req, res) => {
    const { orderedIds } = req.body;

    if (!orderedIds || !Array.isArray(orderedIds)) {
        return res.status(400).json({ error: 'An array of ordered IDs is required.' });
    }

    const db = require('../db/database').db;
    db.serialize(async () => {
        try {
            await runDb('BEGIN TRANSACTION');
            for (let i = 0; i < orderedIds.length; i++) {
                const id = orderedIds[i];
                const display_order = i + 1;
                await runDb('UPDATE projects SET display_order = ? WHERE id = ?', [display_order, id]);
            }
            await runDb('COMMIT');
            res.json({ message: 'All items reordered successfully.' });
        } catch (err) {
            await runDb('ROLLBACK');
            res.status(500).json({ error: 'Failed to reorder items: ' + err.message });
        }
    });
});

module.exports = router;