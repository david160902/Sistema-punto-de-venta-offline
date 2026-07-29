const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, 'pos.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    // 1. Create Settings table
    db.run(`
        CREATE TABLE IF NOT EXISTS settings (
            id INTEGER PRIMARY KEY CHECK (id = 1), -- Ensure only one row exists
            business_name TEXT DEFAULT 'Mi Negocio',
            address TEXT DEFAULT 'Dirección no configurada',
            phone TEXT DEFAULT '',
            ticket_message TEXT DEFAULT '¡Gracias por su compra!',
            printer_ip TEXT DEFAULT '192.168.1.100'
        )
    `, (err) => {
        if (err) console.error("Error creando tabla settings:", err.message);
        else console.log("Tabla settings lista.");
    });

    // 2. Insert default row if not exists
    db.get(`SELECT id FROM settings WHERE id = 1`, (err, row) => {
        if (!row) {
            db.run(`INSERT INTO settings (id) VALUES (1)`, (err) => {
                if (err) console.error("Error insertando settings por defecto:", err.message);
                else console.log("Ajustes por defecto insertados.");
            });
        }
    });
});

setTimeout(() => db.close(), 1000);
