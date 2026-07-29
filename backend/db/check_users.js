const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, 'pos.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.all("SELECT * FROM users", (err, rows) => {
        if (err) {
            console.error("Error:", err.message);
        } else {
            console.log("Filas:", JSON.stringify(rows));
        }
    });
});
