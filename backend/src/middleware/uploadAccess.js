const { db } = require('../db/database');
const authMiddleware = require('./authMiddleware');

module.exports = function uploadAccess(req, res, next) {
  // Previously public resources must not be cached after their visibility changes.
  res.set('Cache-Control', 'private, no-store');
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('Content-Security-Policy', 'sandbox');
  if (req.headers.authorization) return authMiddleware(req, res, next);
  let filename;
  try { filename = decodeURIComponent(req.path.slice(1)); }
  catch { return res.sendStatus(404); }
  if (!filename || filename.includes('/') || filename.includes('\\') || filename.startsWith('.')) {
    return res.sendStatus(404);
  }
  const url = '/uploads/' + filename;
  // Unknown/orphaned files are private. An attachment inherits its parent's privacy.
  const sql = `SELECT 1 AS allowed FROM profile WHERE profile_image_url = ?
    UNION ALL
    SELECT 1 AS allowed FROM attachments a
    LEFT JOIN publications p ON a.parent_type = 'publication' AND a.parent_id = p.id
    LEFT JOIN projects j ON a.parent_type = 'project' AND a.parent_id = j.id
    WHERE a.file_url = ? AND a.is_public = 1
      AND ((a.parent_type = 'publication' AND p.is_public = 1)
        OR (a.parent_type = 'project' AND j.is_public = 1)) LIMIT 1`;
  db.get(sql, [url, url], (error, row) => {
    if (error) return res.status(500).json({ error: 'Unable to check file access.' });
    if (!row) return res.sendStatus(404);
    next();
  });
};
