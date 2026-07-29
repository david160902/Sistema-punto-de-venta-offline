const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.resolve(__dirname, 'pos.db');
const schemaPath = path.resolve(__dirname, 'schema.sql');

console.log('Inicializando la Base de Datos SQLite...');

// Crear o abrir la base de datos (creará pos.db si no existe)
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error abriendo la base de datos:', err.message);
        process.exit(1);
    }
    console.log('✅ Conectado a la base de datos SQLite (pos.db).');
});

// Leer el archivo SQL que redactamos
const schema = fs.readFileSync(schemaPath, 'utf8');

// Ejecutar todo el SQL para crear las tablas
db.exec(schema, (err) => {
    if (err) {
        console.error('❌ Error creando las tablas:', err.message);
    } else {
        console.log('✅ Tablas creadas exitosamente según el plan.');
    }
    
    // Cerrar la conexión
    db.close((err) => {
        if (err) {
            console.error('Error cerrando la conexión:', err.message);
        } else {
            console.log('Proceso finalizado.');
        }
    });
});
