const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { runDb, getDb, allDb } = require('../utils/db-helpers');

// --- Public Route ---
router.get('/public', async (req, res) => {
    try {
        const publicationsSql = "SELECT * FROM publications WHERE is_public = TRUE ORDER BY display_order ASC, id ASC";
        const publications = await allDb(publicationsSql);

        if (publications.length === 0) return res.json({ data: [] });

        const publicationIds = publications.map(p => p.id);
        const placeholders = publicationIds.map(() => '?').join(',');
        const attachmentsSql = `SELECT * FROM attachments WHERE is_public = TRUE AND parent_type = 'publication' AND parent_id IN (${placeholders})`;
        const attachments = await allDb(attachmentsSql, publicationIds);

        const attachmentsByParentId = attachments.reduce((acc, att) => {
            if (!acc[att.parent_id]) acc[att.parent_id] = [];
            acc[att.parent_id].push(att);
            return acc;
        }, {});

        const results = publications.map(pub => ({
            ...pub,
            attachments: attachmentsByParentId[pub.id] || []
        }));

        res.json({ data: results });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch public publications: ' + err.message });
    }
});

// --- Protected Routes ---

// GET all publication records (for admin)
router.get('/', authMiddleware, async (req, res) => {
    try {
        const publications = await allDb("SELECT * FROM publications ORDER BY display_order ASC, id ASC");
        res.json({ data: publications });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST a new publication record
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { title, authors, journal_or_conference, publication_date, url, is_public } = req.body;

        // Get the current max display order and add 1
        const row = await getDb("SELECT MAX(display_order) as max_order FROM publications");
        const new_order = (row.max_order || 0) + 1;

        const sql = `INSERT INTO publications (title, authors, journal_or_conference, publication_date, url, is_public, display_order) VALUES (?, ?, ?, ?, ?, ?, ?)`;
        const params = [title, authors, journal_or_conference, publication_date, url, is_public, new_order];
        const result = await runDb(sql, params);

        res.json({ message: "Success", data: { id: result.id, ...req.body, display_order: new_order } });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// PUT (update) a publication record by id
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { title, authors, journal_or_conference, publication_date, url, is_public } = req.body;
        const sql = `UPDATE publications SET title = ?, authors = ?, journal_or_conference = ?, publication_date = ?, url = ?, is_public = ? WHERE id = ?`;
        const params = [title, authors, journal_or_conference, publication_date, url, is_public, req.params.id];
        const result = await runDb(sql, params);
        res.json({ message: `Record ${req.params.id} updated`, changes: result.changes });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// DELETE a publication record by id
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const result = await runDb('DELETE FROM publications WHERE id = ?', [req.params.id]);
        res.json({ message: "Deleted", changes: result.changes });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// POST to save the new order of all items after a drag-and-drop
router.post('/reorder-all', authMiddleware, async (req, res) => {
    const { orderedIds } = req.body; // Expecting an array of IDs in the new order

    if (!orderedIds || !Array.isArray(orderedIds)) {
        return res.status(400).json({ error: 'An array of ordered IDs is required.' });
    }

    const db = require('../db/database').db; // Direct access for transaction
    db.serialize(async () => {
        try {
            await runDb('BEGIN TRANSACTION');
            for (let i = 0; i < orderedIds.length; i++) {
                const id = orderedIds[i];
                const display_order = i + 1; // Order is 1-based index
                await runDb('UPDATE publications SET display_order = ? WHERE id = ?', [display_order, id]);
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