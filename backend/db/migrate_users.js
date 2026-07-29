const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'pos.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    // Crear tabla de usuarios
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            pin TEXT NOT NULL UNIQUE,
            role TEXT NOT NULL DEFAULT 'CASHIER',
            active INTEGER DEFAULT 1
        )
    `, (err) => {
        if (err) console.error("Error creando tabla users:", err.message);
        else console.log("Tabla users verificada/creada.");
    });

    // Insertar el Admin por defecto si no existe
    db.get(`SELECT id FROM users WHERE role = 'ADMIN'`, (err, row) => {
        if (err) {
            console.error(err.message);
            return;
        }
        if (!row) {
            db.run(`INSERT INTO users (name, pin, role, active) VALUES ('Administrador', '0000', 'ADMIN', 1)`, (err) => {
                if (err) console.error("Error creando admin:", err.message);
                else console.log("Administrador por defecto creado con PIN: 0000");
            });
        } else {
            console.log("El Administrador ya existe en la base de datos.");
        }
    });
});

setTimeout(() => db.close(), 1000);
