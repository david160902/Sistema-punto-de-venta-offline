const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, 'pos.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS users_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            pin_code TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'CASHIER',
            active INTEGER DEFAULT 1
        )
    `);

    db.run(`INSERT INTO users_new SELECT id, username, pin_code, role, active FROM users`);
    db.run(`DROP TABLE users`);
    db.run(`ALTER TABLE users_new RENAME TO users`);

    console.log("Migración completada: Se eliminó la restricción UNIQUE de pin_code.");
});

setTimeout(() => db.close(), 1000);
