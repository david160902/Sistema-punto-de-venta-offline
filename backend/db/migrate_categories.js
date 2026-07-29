const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const db = new sqlite3.Database(path.join(__dirname, 'pos.db'));

db.serialize(() => {
    db.run("ALTER TABLE categories ADD COLUMN bg_color TEXT DEFAULT '#334155'", function(err) {
        if (err) {
            console.log("Error (o la columna ya existe):", err.message);
        } else {
            console.log("Columna bg_color agregada a categories exitosamente.");
        }
    });
});
db.close();
