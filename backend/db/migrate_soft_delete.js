const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const db = new sqlite3.Database(path.join(__dirname, 'pos.db'));

db.serialize(() => {
    const tables = ['categories', 'products', 'extras', 'discounts'];
    tables.forEach(table => {
        db.run(`ALTER TABLE ${table} ADD COLUMN active INTEGER DEFAULT 1`, (err) => {
            if (err) {
                if(err.message.includes("duplicate column name")) {
                    console.log(`Columna active ya existe en ${table}`);
                } else {
                    console.error(`Error en ${table}:`, err.message);
                }
            } else {
                console.log(`Columna active agregada a ${table}`);
            }
        });
    });
});
