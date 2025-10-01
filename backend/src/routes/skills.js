const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { runDb, getDb, allDb } = require('../utils/db-helpers');

// --- Public Route ---
router.get('/public', async (req, res) => {
    try {
        const items = await allDb("SELECT * FROM skills WHERE is_public = TRUE ORDER BY display_order ASC, id ASC");
        res.json({ data: items });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch public skills: ' + err.message });
    }
});

// --- Protected Routes ---
router.get('/', authMiddleware, async (req, res) => {
    try {
        const items = await allDb("SELECT * FROM skills ORDER BY display_order ASC, id ASC");
        res.json({ data: items });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/', authMiddleware, async (req, res) => {
    try {
        const { name, category, is_public } = req.body;
        const row = await getDb("SELECT MAX(display_order) as max_order FROM skills");
        const new_order = (row.max_order || 0) + 1;
        const sql = `INSERT INTO skills (name, category, is_public, display_order) VALUES (?, ?, ?, ?)`;
        const params = [name, category, is_public, new_order];
        const result = await runDb(sql, params);
        res.json({ message: "Success", data: { id: result.id, ...req.body, display_order: new_order } });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { name, category, is_public } = req.body;
        const sql = `UPDATE skills SET name = ?, category = ?, is_public = ? WHERE id = ?`;
        const params = [name, category, is_public, req.params.id];
        const result = await runDb(sql, params);
        res.json({ message: `Record ${req.params.id} updated`, changes: result.changes });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const result = await runDb('DELETE FROM skills WHERE id = ?', [req.params.id]);
        res.json({ message: "Deleted", changes: result.changes });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.post('/:id/reorder', authMiddleware, async (req, res) => {
    try {
        const { direction } = req.body;
        const itemId = parseInt(req.params.id, 10);
        const items = await allDb("SELECT id, display_order FROM skills ORDER BY display_order ASC, id ASC");
        const currentIndex = items.findIndex(item => item.id === itemId);

        if (currentIndex === -1) return res.status(404).json({ error: 'Item not found.' });

        let otherIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        if (otherIndex < 0 || otherIndex >= items.length) return res.status(400).json({ error: 'Cannot move item further.' });

        const itemA = items[currentIndex];
        const itemB = items[otherIndex];

        db.serialize(async () => {
            try {
                await runDb('BEGIN TRANSACTION');
                await runDb('UPDATE skills SET display_order = ? WHERE id = ?', [itemB.display_order, itemA.id]);
                await runDb('UPDATE skills SET display_order = ? WHERE id = ?', [itemA.display_order, itemB.id]);
                await runDb('COMMIT');
                res.json({ message: 'Reordered successfully.' });
            } catch(err) {
                await runDb('ROLLBACK');
                throw err;
            }
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to reorder item: ' + err.message });
    }
});

module.exports = router;