const express = require('express');
const router = express.Router();
const { db } = require('../db/database');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

// --- Multer Configuration for File Uploads ---
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Not an image! Please upload only images.'), false);
    }
  },
  limits: { fileSize: 1024 * 1024 * 5 } // 5MB file size limit
});

// --- Public Route ---
// GET the profile data
router.get('/', (req, res) => {
  const sql = "SELECT * FROM profile LIMIT 1";
  db.get(sql, [], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ data: row || {} });
  });
});

// --- Protected Route ---
// POST (create or update) the profile data, now with robust logic
router.post('/', authMiddleware, upload.single('profileImage'), async (req, res) => {
  const { full_name, email, phone, linkedin_url, github_url, bio } = req.body;

  try {
    // First, check if a profile record already exists
    const existingProfile = await new Promise((resolve, reject) => {
      db.get("SELECT * FROM profile WHERE id = 1", [], (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });

    let sql;
    const params = [full_name, email, phone, linkedin_url, github_url, bio];

    if (existingProfile) {
      // --- UPDATE existing profile ---
      let setClauses = [
        'full_name = ?', 'email = ?', 'phone = ?',
        'linkedin_url = ?', 'github_url = ?', 'bio = ?'
      ];
      // Only add the profile image to the update if a new file was uploaded
      if (req.file) {
        setClauses.push('profile_image_url = ?');
        params.push(`/uploads/${req.file.filename}`);
      }
      sql = `UPDATE profile SET ${setClauses.join(', ')} WHERE id = 1`;
    } else {
      // --- INSERT new profile ---
      let columns = ['id', 'full_name', 'email', 'phone', 'linkedin_url', 'github_url', 'bio'];
      let placeholders = ['1'].concat(params.map(() => '?')).join(', ');

      if (req.file) {
        columns.push('profile_image_url');
        placeholders += ', ?';
        params.push(`/uploads/${req.file.filename}`);
      }
      sql = `INSERT INTO profile (${columns.join(', ')}) VALUES (${placeholders})`;
    }

    // Execute the determined SQL query
    await new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) reject(err);
            resolve();
        });
    });

    // Fetch the latest profile data to send back to the client
    const updatedProfile = await new Promise((resolve, reject) => {
        db.get("SELECT * FROM profile WHERE id = 1", [], (err, row) => {
            if (err) reject(err);
            resolve(row);
        });
    });

    res.json({
        message: "Profile updated successfully",
        data: updatedProfile
    });

  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile: ' + error.message });
  }
});

module.exports = router;