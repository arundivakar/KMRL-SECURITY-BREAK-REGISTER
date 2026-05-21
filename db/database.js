const Database =
    require('better-sqlite3');

const db =
    new Database('./db/breaks.db');

module.exports = db;
