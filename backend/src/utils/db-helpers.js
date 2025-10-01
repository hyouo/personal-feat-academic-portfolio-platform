const { db } = require('../db/database');

/**
 * A promise-based wrapper for the db.run command.
 * @param {string} sql The SQL query to execute.
 * @param {Array} params The parameters to bind to the query.
 * @returns {Promise<{id: number, changes: number}>} A promise that resolves with the last insert ID and number of changes.
 */
const runDb = (sql, params = []) => new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, changes: this.changes });
    });
});

/**
 * A promise-based wrapper for the db.get command.
 * @param {string} sql The SQL query to execute.
 * @param {Array} params The parameters to bind to the query.
 * @returns {Promise<object>} A promise that resolves with a single row.
 */
const getDb = (sql, params = []) => new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
    });
});

/**
 * A promise-based wrapper for the db.all command.
 * @param {string} sql The SQL query to execute.
 * @param {Array} params The parameters to bind to the query.
 * @returns {Promise<Array<object>>} A promise that resolves with an array of rows.
 */
const allDb = (sql, params = []) => new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
    });
});

module.exports = {
    runDb,
    getDb,
    allDb,
};