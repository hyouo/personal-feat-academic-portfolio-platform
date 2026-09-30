const path = require('node:path');
const BACKEND_ROOT = path.resolve(__dirname, '..');
const UPLOAD_DIR = path.resolve(process.env.PORTFOLIO_UPLOAD_DIR || path.join(BACKEND_ROOT, 'uploads'));
const DB_PATH = path.resolve(process.env.PORTFOLIO_DB_PATH || path.join(BACKEND_ROOT, 'src/db/portfolio.db'));
module.exports = { BACKEND_ROOT, UPLOAD_DIR, DB_PATH };
