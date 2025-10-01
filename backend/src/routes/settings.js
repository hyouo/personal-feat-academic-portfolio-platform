const express = require('express');
const router = express.Router();
const { db } = require('../db/database');
const authMiddleware = require('../middleware/authMiddleware');

// Helper function for promisified DB calls
const runDb = (sql, params = []) => new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, changes: this.changes });
    });
});

const getDb = (sql, params = []) => new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
    });
});

// --- Settings Routes ---

// GET a specific setting by key
router.get('/:key', async (req, res) => {
    try {
        const { key } = req.params;
        const row = await getDb("SELECT value FROM settings WHERE key = ?", [key]);
        if (row) {
            res.json({ key, value: JSON.parse(row.value) });
        } else {
            res.status(404).json({ error: 'Setting not found' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Failed to get setting: ' + err.message });
    }
});

// POST (update) a setting
router.post('/:key', authMiddleware, async (req, res) => {
    try {
        const { key } = req.params;
        const { value } = req.body;
        const stringValue = JSON.stringify(value);

        const sql = `
            INSERT INTO settings (key, value) VALUES (?, ?)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value;
        `;
        await runDb(sql, [key, stringValue]);
        res.json({ message: `Setting '${key}' updated successfully.` });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;