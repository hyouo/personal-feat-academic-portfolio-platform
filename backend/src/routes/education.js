const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { runDb, getDb, allDb } = require('../utils/db-helpers');

// --- Public Route ---
router.get('/public', async (req, res) => {
    try {
        const items = await allDb("SELECT * FROM education WHERE is_public = TRUE ORDER BY display_order ASC, id ASC");
        res.json({ data: items });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch public education records: ' + err.message });
    }
});

// --- Protected Routes ---

// GET all education records (for admin)
router.get('/', authMiddleware, async (req, res) => {
    try {
        const items = await allDb("SELECT * FROM education ORDER BY display_order ASC, id ASC");
        res.json({ data: items });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST a new education record
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { institution, degree, field_of_study, start_date, end_date, is_public } = req.body;

        const row = await getDb("SELECT MAX(display_order) as max_order FROM education");
        const new_order = (row.max_order || 0) + 1;

        const sql = `INSERT INTO education (institution, degree, field_of_study, start_date, end_date, is_public, display_order) VALUES (?, ?, ?, ?, ?, ?, ?)`;
        const params = [institution, degree, field_of_study, start_date, end_date, is_public, new_order];
        const result = await runDb(sql, params);

        res.json({ message: "Success", data: { id: result.id, ...req.body, display_order: new_order } });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// PUT (update) an education record by id
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { institution, degree, field_of_study, start_date, end_date, is_public } = req.body;
        const sql = `UPDATE education SET institution = ?, degree = ?, field_of_study = ?, start_date = ?, end_date = ?, is_public = ? WHERE id = ?`;
        const params = [institution, degree, field_of_study, start_date, end_date, is_public, req.params.id];
        const result = await runDb(sql, params);
        res.json({ message: `Record ${req.params.id} updated`, changes: result.changes });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// DELETE an education record by id
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const result = await runDb('DELETE FROM education WHERE id = ?', [req.params.id]);
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
                await runDb('UPDATE education SET display_order = ? WHERE id = ?', [display_order, id]);
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