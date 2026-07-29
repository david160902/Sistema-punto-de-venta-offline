const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const db = new sqlite3.Database(path.join(__dirname, 'pos.db'));

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS discounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        value REAL NOT NULL
    )`, function(err) {
        if (err) {
            console.log("Error:", err.message);
        } else {
            console.log("Tabla discounts creada exitosamente.");
        }
    });
});
db.close();
