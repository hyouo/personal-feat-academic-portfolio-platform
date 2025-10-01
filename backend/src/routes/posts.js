const express = require('express');
const router = express.Router();
const { db } = require('../db/database');
const authMiddleware = require('../middleware/authMiddleware');

// Helper function to generate a URL-friendly slug
const slugify = (text) => {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
};

// Helper functions for promisified DB calls
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

const allDb = (sql, params = []) => new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
    });
});

// --- Public Routes ---
// GET all public posts (for blog list page)
router.get('/public', async (req, res) => {
    try {
        const items = await allDb("SELECT id, title, slug, publication_date FROM posts WHERE is_public = TRUE ORDER BY display_order ASC, id ASC");
        res.json({ data: items });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch public posts: ' + err.message });
    }
});

// GET a single public post by its slug
router.get('/public/:slug', async (req, res) => {
    try {
        const item = await getDb("SELECT * FROM posts WHERE slug = ? AND is_public = TRUE", [req.params.slug]);
        if (item) {
            res.json({ data: item });
        } else {
            res.status(404).json({ error: 'Post not found or is not public.' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch post: ' + err.message });
    }
});


// --- Protected Routes ---
router.get('/', authMiddleware, async (req, res) => {
    try {
        const items = await allDb("SELECT * FROM posts ORDER BY display_order ASC, id ASC");
        res.json({ data: items });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/', authMiddleware, async (req, res) => {
    try {
        const { title, content, publication_date, is_public } = req.body;
        const slug = slugify(title);
        // Ensure slug is unique
        const existing = await getDb("SELECT id FROM posts WHERE slug = ?", [slug]);
        if (existing) {
            return res.status(400).json({ error: `A post with the slug '${slug}' already exists. Please choose a different title.` });
        }

        const row = await getDb("SELECT MAX(display_order) as max_order FROM posts");
        const new_order = (row.max_order || 0) + 1;
        const sql = `INSERT INTO posts (title, slug, content, publication_date, is_public, display_order) VALUES (?, ?, ?, ?, ?, ?)`;
        const params = [title, slug, content, publication_date, is_public, new_order];
        const result = await runDb(sql, params);
        res.json({ message: "Success", data: { id: result.id, ...req.body, slug, display_order: new_order } });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { title, content, publication_date, is_public } = req.body;
        const slug = slugify(title);
        // Ensure slug is unique (ignoring the current post)
        const existing = await getDb("SELECT id FROM posts WHERE slug = ? AND id != ?", [slug, req.params.id]);
        if (existing) {
            return res.status(400).json({ error: `A post with the slug '${slug}' already exists. Please choose a different title.` });
        }

        const sql = `UPDATE posts SET title = ?, slug = ?, content = ?, publication_date = ?, is_public = ? WHERE id = ?`;
        const params = [title, slug, content, publication_date, is_public, req.params.id];
        const result = await runDb(sql, params);
        res.json({ message: `Record ${req.params.id} updated`, changes: result.changes });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const result = await runDb('DELETE FROM posts WHERE id = ?', [req.params.id]);
        res.json({ message: "Deleted", changes: result.changes });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.post('/:id/reorder', authMiddleware, async (req, res) => {
    try {
        const { direction } = req.body;
        const itemId = parseInt(req.params.id, 10);
        const items = await allDb("SELECT id, display_order FROM posts ORDER BY display_order ASC, id ASC");
        const currentIndex = items.findIndex(item => item.id === itemId);

        if (currentIndex === -1) return res.status(404).json({ error: 'Item not found.' });

        let otherIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        if (otherIndex < 0 || otherIndex >= items.length) return res.status(400).json({ error: 'Cannot move item further.' });

        const itemA = items[currentIndex];
        const itemB = items[otherIndex];

        db.serialize(async () => {
            try {
                await runDb('BEGIN TRANSACTION');
                await runDb('UPDATE posts SET display_order = ? WHERE id = ?', [itemB.display_order, itemA.id]);
                await runDb('UPDATE posts SET display_order = ? WHERE id = ?', [itemA.display_order, itemB.id]);
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