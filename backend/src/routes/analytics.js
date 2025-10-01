const express = require('express');
const router = express.Router();
const { allDb } = require('../utils/db-helpers');
const authMiddleware = require('../middleware/authMiddleware');

// --- Analytics Routes (Protected) ---

// GET publication statistics (e.g., count per year)
router.get('/publication-stats', authMiddleware, async (req, res) => {
    try {
        // This query extracts the year from the publication_date and counts entries for each year.
        // It's designed to handle various date formats as long as the year is 4 digits.
        const sql = `
            SELECT
                SUBSTR(publication_date, 1, 4) as year,
                COUNT(*) as count
            FROM
                publications
            WHERE
                SUBSTR(publication_date, 1, 4) GLOB '[0-9][0-9][0-9][0-9]'
            GROUP BY
                year
            ORDER BY
                year ASC;
        `;
        const stats = await allDb(sql);
        res.json({ data: stats });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch publication statistics: ' + err.message });
    }
});

module.exports = router;