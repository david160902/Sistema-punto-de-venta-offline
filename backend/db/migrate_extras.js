const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const db = new sqlite3.Database(path.join(__dirname, 'pos.db'));

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS extras (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS extra_options (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        extra_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        price REAL DEFAULT 0,
        FOREIGN KEY (extra_id) REFERENCES extras(id) ON DELETE CASCADE
    )`, function(err) {
        if (err) {
            console.log("Error:", err.message);
        } else {
            console.log("Tablas de extras creadas exitosamente.");
        }
    });
});
db.close();
