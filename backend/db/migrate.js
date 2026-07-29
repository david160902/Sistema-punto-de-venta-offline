const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const db = new sqlite3.Database(path.resolve(__dirname, 'pos.db'));

db.serialize(() => {
    db.run("ALTER TABLE products ADD COLUMN selling_type TEXT DEFAULT 'UNIT'", (err) => {
        if(err) console.log("Columna selling_type ya existía.");
        else console.log("Columna selling_type agregada.");
    });
    db.run("ALTER TABLE products ADD COLUMN bg_color TEXT DEFAULT '#334155'", (err) => {
        if(err) console.log("Columna bg_color ya existía.");
        else console.log("Columna bg_color agregada.");
    });
});

setTimeout(() => db.close(), 1000);
