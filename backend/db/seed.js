const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const db = new sqlite3.Database(path.join(__dirname, 'pos.db'));

db.serialize(() => {
    // 1. Limpiar tablas
    db.run("DELETE FROM extra_options");
    db.run("DELETE FROM extras");
    db.run("DELETE FROM products");
    db.run("DELETE FROM categories");
    db.run("DELETE FROM discounts");

    // 2. Insertar Categorías de Chifa
    const insertCat = db.prepare("INSERT INTO categories (id, name, display_order, bg_color, active) VALUES (?, ?, ?, ?, 1)");
    insertCat.run(1, 'Entradas', 1, '#ef4444'); // Red
    insertCat.run(2, 'Sopas', 2, '#3b82f6'); // Blue
    insertCat.run(3, 'Platos de Fondo', 3, '#f59e0b'); // Orange
    insertCat.run(4, 'Bebidas', 4, '#10b981'); // Green
    insertCat.finalize();

    // 3. Insertar Descuentos
    const insertDisc = db.prepare("INSERT INTO discounts (id, name, type, value, active) VALUES (?, ?, ?, ?, 1)");
    insertDisc.run(1, 'Cortesía del Dueño', 'PERCENTAGE', 100);
    insertDisc.run(2, 'Promoción Vecinos', 'PERCENTAGE', 10);
    insertDisc.run(3, 'Descuento S/ 5.00', 'FIXED', 5.00);
    insertDisc.finalize();

    // 4. Insertar Extras típicos de Chifa
    const insertExtra = db.prepare("INSERT INTO extras (id, name, active) VALUES (?, ?, 1)");
    insertExtra.run(1, 'Salsas Extra');
    insertExtra.run(2, 'Agregados Especiales');
    insertExtra.finalize();

    // 5. Insertar Opciones de Extras
    const insertOpt = db.prepare("INSERT INTO extra_options (extra_id, name, price) VALUES (?, ?, ?)");
    // Salsas
    insertOpt.run(1, 'Extra Tamarindo', 1.00);
    insertOpt.run(1, 'Extra Sillao', 0.50);
    insertOpt.run(1, 'Ají de Chifa', 1.00);
    // Agregados
    insertOpt.run(2, 'Huevo Frito Montado', 3.00);
    insertOpt.run(2, 'Porción Arroz Blanco', 4.00);
    insertOpt.run(2, 'Fideos Fritos Extra', 5.00);
    insertOpt.finalize();

    // 6. Insertar Productos 100% Chifa (TODOS con imágenes)
    const insertProd = db.prepare("INSERT INTO products (id, category_id, name, price, image_url, is_available, selling_type, bg_color, active) VALUES (?, ?, ?, ?, ?, 1, ?, ?, 1)");
    
    // Entradas
    insertProd.run(1, 1, 'Wantán Frito (1/2 Docena)', 12.00, 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&q=80', 'UNIT', '#ef4444');
    insertProd.run(2, 1, 'Tequeños de Lomo', 15.00, 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=800&q=80', 'UNIT', '#ef4444');
    
    // Sopas
    insertProd.run(3, 2, 'Sopa Wantán', 14.00, 'https://images.unsplash.com/photo-1548943487-a2e4e43b4859?auto=format&fit=crop&w=800&q=80', 'UNIT', '#3b82f6');
    insertProd.run(4, 2, 'Sopa Fuchi Fu', 16.00, 'https://images.unsplash.com/photo-1594553255157-19ce7dbd0774?auto=format&fit=crop&w=800&q=80', 'UNIT', '#3b82f6');
    
    // Platos de Fondo
    insertProd.run(5, 3, 'Arroz Chaufa de Pollo', 18.00, 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=800&q=80', 'UNIT', '#f59e0b');
    insertProd.run(6, 3, 'Tallarín Saltado de Carne', 22.00, 'https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&w=800&q=80', 'UNIT', '#f59e0b');
    insertProd.run(7, 3, 'Pollo Chi Jau Kay', 25.00, 'https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=800&q=80', 'UNIT', '#f59e0b');
    insertProd.run(8, 3, 'Pollo Ti Pa Kay (Dulce)', 24.00, 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=800&q=80', 'UNIT', '#f59e0b');
    insertProd.run(9, 3, 'Aeropuerto Especial', 26.00, 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80', 'UNIT', '#f59e0b');
    insertProd.run(10, 3, 'Kam Lu Wantán', 28.00, 'https://images.unsplash.com/photo-1582450871972-ab5ca641643d?auto=format&fit=crop&w=800&q=80', 'UNIT', '#f59e0b');
    
    // Bebidas
    insertProd.run(11, 4, 'Inca Kola 1 Litro', 9.00, 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=800&q=80', 'UNIT', '#10b981');
    insertProd.run(12, 4, 'Jarra de Chicha Morada', 12.00, 'https://images.unsplash.com/photo-1595981267035-7b04d84b4e69?auto=format&fit=crop&w=800&q=80', 'UNIT', '#10b981');

    insertProd.finalize();

    console.log("¡Base de datos sembrada con menú 100% CHIFA y todas las fotos incluidas!");
});

db.close();
