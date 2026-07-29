const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, 'pos.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    // Add active column to users table
    db.run("ALTER TABLE users ADD COLUMN active INTEGER DEFAULT 1", (err) => {
        if (err) {
            console.log("Columna 'active' ya existe o hubo error:", err.message);
        } else {
            console.log("Columna 'active' agregada a users.");
        }
    });

    // Update the existing admin to match our new standard (role='ADMIN', pin='0000', username='Administrador')
    db.run("UPDATE users SET username = 'Administrador', pin_code = '0000', role = 'ADMIN' WHERE id = 1", (err) => {
        if (err) console.error("Error actualizando admin:", err.message);
        else console.log("Administrador actualizado.");
    });
    
    // Convert 'OPERADOR' role to 'CASHIER'
    db.run("UPDATE users SET role = 'CASHIER' WHERE role = 'OPERADOR'", (err) => {
        if (err) console.error("Error actualizando roles:", err.message);
        else console.log("Roles actualizados a CASHIER.");
    });
});
