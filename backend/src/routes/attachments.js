const express = require('express');
const router = express.Router();
const { db } = require('../db/database');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const { UPLOAD_DIR } = require('../paths');
const fs = require('fs');

// --- Multer Configuration for Generic File Uploads ---
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 10 } // 10MB file size limit
});

// --- API Routes for Attachments ---

// GET all attachments (for the file library)
router.get('/', authMiddleware, (req, res) => {
  const sql = "SELECT * FROM attachments ORDER BY id DESC";
  db.all(sql, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ data: rows });
  });
});

// GET all attachments for a specific parent item (e.g., a publication or project)
router.get('/:parent_type/:parent_id', authMiddleware, (req, res) => {
  const { parent_type, parent_id } = req.params;
  const sql = "SELECT * FROM attachments WHERE parent_type = ? AND parent_id = ?";
  db.all(sql, [parent_type, parent_id], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ data: rows });
  });
});

// POST a new attachment for a parent item
router.post('/', authMiddleware, upload.single('attachmentFile'), (req, res) => {
  const { parent_id, parent_type, description } = req.body;
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  const file_url = `/uploads/${req.file.filename}`;
  const original_name = req.file.originalname;

  const sql = `INSERT INTO attachments (file_url, original_name, description, parent_id, parent_type, is_public) VALUES (?, ?, ?, ?, ?, ?)`;
  const params = [file_url, original_name, description, parent_id, parent_type, true]; // Default to public

  db.run(sql, params, function (err) {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({
      message: "Attachment uploaded successfully",
      data: { id: this.lastID, file_url, original_name, description, parent_id, parent_type, is_public: true }
    });
  });
});

// PUT (update) an attachment's details (e.g., description or public status)
router.put('/:id', authMiddleware, (req, res) => {
  const { description, is_public } = req.body;
  const sql = `UPDATE attachments SET description = ?, is_public = ? WHERE id = ?`;
  const params = [description, is_public, req.params.id];
  db.run(sql, params, function (err) {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({ message: `Attachment ${req.params.id} updated`, changes: this.changes });
  });
});

// DELETE an attachment
router.delete('/:id', authMiddleware, (req, res) => {
  const attachmentId = req.params.id;
  // First, get the file path from the database
  const getSql = "SELECT file_url FROM attachments WHERE id = ?";
  db.get(getSql, [attachmentId], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Attachment not found.' });
    }

    // Construct the full file path
    // A stored URL must be a flat uploads URL, never an arbitrary filesystem path.
    if (!row.file_url.startsWith('/uploads/') || path.basename(row.file_url) !== row.file_url.slice('/uploads/'.length)) {
      return res.status(400).json({ error: 'Invalid stored attachment path.' });
    }
    const filePath = path.join(UPLOAD_DIR, path.basename(row.file_url));

    // Delete the file from the filesystem
    fs.unlink(filePath, (unlinkErr) => {
      if (unlinkErr) {
        // Log the error but proceed to delete from DB anyway
        console.error(`Failed to delete file ${filePath}:`, unlinkErr);
      }

      // Then, delete the record from the database
      const deleteSql = 'DELETE FROM attachments WHERE id = ?';
      db.run(deleteSql, [attachmentId], function (dbErr) {
        if (dbErr) {
          return res.status(400).json({ error: dbErr.message });
        }
        res.json({ message: "Attachment deleted successfully", changes: this.changes });
      });
    });
  });
});

module.exports = router;