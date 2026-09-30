const sqlite3 = require('sqlite3').verbose();
const { DB_PATH } = require('../paths');

const dbPath = DB_PATH;
const db = new sqlite3.Database(dbPath);

// A promise-based wrapper for db.run to make it awaitable
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) {
        console.error('Error running sql: ' + sql, err.message);
        reject(err);
      } else {
        resolve({ id: this.lastID });
      }
    });
  });
}

// The master initialization function, now returns a single promise
function initialize() {
  return new Promise((resolve, reject) => {
    console.log('Starting database initialization with robust promise chain...');

    // db.serialize ensures commands queue in order. We chain promises to ensure
    // we wait for the full sequence to complete.
    db.serialize(() => {
        run(`CREATE TABLE IF NOT EXISTS profile (id INTEGER PRIMARY KEY, full_name TEXT, email TEXT, phone TEXT, linkedin_url TEXT, github_url TEXT, bio TEXT, profile_image_url TEXT)`)
        .then(() => run(`CREATE TABLE IF NOT EXISTS education (id INTEGER PRIMARY KEY, institution TEXT, degree TEXT, field_of_study TEXT, start_date TEXT, end_date TEXT, is_public BOOLEAN, display_order INTEGER)`))
        .then(() => run(`CREATE TABLE IF NOT EXISTS work_experience (id INTEGER PRIMARY KEY, company TEXT, position TEXT, start_date TEXT, end_date TEXT, description TEXT, is_public BOOLEAN, display_order INTEGER)`))
        .then(() => run(`CREATE TABLE IF NOT EXISTS publications (id INTEGER PRIMARY KEY, title TEXT, authors TEXT, journal_or_conference TEXT, publication_date TEXT, url TEXT, is_public BOOLEAN, display_order INTEGER)`))
        .then(() => run(`CREATE TABLE IF NOT EXISTS projects (id INTEGER PRIMARY KEY, name TEXT, description TEXT, start_date TEXT, end_date TEXT, url TEXT, is_public BOOLEAN, display_order INTEGER)`))
        .then(() => run(`CREATE TABLE IF NOT EXISTS honors (id INTEGER PRIMARY KEY, title TEXT, issuer TEXT, date TEXT, description TEXT, is_public BOOLEAN, display_order INTEGER)`))
        .then(() => run(`CREATE TABLE IF NOT EXISTS teaching (id INTEGER PRIMARY KEY, course_name TEXT, institution TEXT, role TEXT, date TEXT, description TEXT, is_public BOOLEAN, display_order INTEGER)`))
        .then(() => run(`CREATE TABLE IF NOT EXISTS skills (id INTEGER PRIMARY KEY, name TEXT, category TEXT, is_public BOOLEAN, display_order INTEGER)`))
        .then(() => run(`CREATE TABLE IF NOT EXISTS posts (id INTEGER PRIMARY KEY, title TEXT, slug TEXT UNIQUE, content TEXT, publication_date TEXT, is_public BOOLEAN, display_order INTEGER)`))
        .then(() => run(`
          CREATE TABLE IF NOT EXISTS attachments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            file_url TEXT NOT NULL,
            original_name TEXT NOT NULL,
            description TEXT,
            parent_id INTEGER NOT NULL,
            parent_type TEXT NOT NULL,
            is_public BOOLEAN DEFAULT TRUE
          )
        `))
        .then(() => run(`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT)`))
        .then(() => {
            console.log('Tables created or verified.');
            // Now seed the data
            return run(`
              INSERT INTO profile (id, full_name, email, phone, linkedin_url, github_url, bio)
              SELECT 1, 'Dr. Alex Turing', 'alex.turing@example.com', '123-456-7890', 'https://linkedin.com/in/alexturing', 'https://github.com/alexturing', 'Pioneering researcher in the field of artificial intelligence and computational theory.'
              WHERE NOT EXISTS (SELECT 1 FROM profile WHERE id = 1);
            `);
        })
        .then(() => {
            return run(`
              INSERT INTO education (id, institution, degree, field_of_study, start_date, end_date, is_public)
              SELECT 1, 'University of Cambridge', 'Ph.D.', 'Computer Science', '2010', '2014', 1
              WHERE NOT EXISTS (SELECT 1 FROM education WHERE id = 1);
            `);
        })
        .then(() => {
            // Seed the default module order
            const defaultOrder = JSON.stringify(['education', 'work', 'teaching', 'publications', 'projects', 'honors', 'skills']);
            return run(`INSERT INTO settings (key, value) SELECT 'module_order', ? WHERE NOT EXISTS (SELECT 1 FROM settings WHERE key = 'module_order')`, [defaultOrder]);
        })
        .then(() => {
            // Seed the default theme
            const defaultTheme = JSON.stringify('default');
            return run(`INSERT INTO settings (key, value) SELECT 'theme', ? WHERE NOT EXISTS (SELECT 1 FROM settings WHERE key = 'theme')`, [defaultTheme]);
        })
        .then(() => {
            // Seed the default font
            const defaultFont = JSON.stringify('sans-serif');
            return run(`INSERT INTO settings (key, value) SELECT 'font', ? WHERE NOT EXISTS (SELECT 1 FROM settings WHERE key = 'font')`, [defaultFont]);
        })
        .then(() => {
            console.log('Database seeded.');
            resolve(); // Resolve the main promise ONLY after all .then() calls have completed
        })
        .catch(error => {
            console.error('Error during database initialization sequence:', error);
            reject(error); // Reject the main promise if any step fails
        });
    });
  });
}

module.exports = { db, initialize };