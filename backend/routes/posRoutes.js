const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const os = require('os');
const { exec } = require('child_process');
const multer = require('multer');
const printerService = require('../services/printerService');

// Configuración de Multer para guardar imágenes en la PC
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

const dbPath = path.resolve(__dirname, '../db/pos.db');
const db = new sqlite3.Database(dbPath);

// ENDPOINT: Obtener Menú Completo
router.get('/menu', (req, res) => {
    db.all("SELECT * FROM categories WHERE active = 1", [], (err, categories) => {
        if (err) return res.status(500).json({ error: err.message });
        db.all("SELECT * FROM products WHERE active = 1", [], (err, products) => {
            if (err) return res.status(500).json({ error: err.message });
            db.all("SELECT * FROM extras WHERE active = 1", [], (err, extras) => {
                db.all("SELECT * FROM extra_options", [], (err, extra_options) => {
                    db.all("SELECT * FROM discounts WHERE active = 1", [], (err, discounts) => {
                        res.json({ categories, products, extras: extras || [], extra_options: extra_options || [], discounts: discounts || [] });
                    });
                });
            });
        });
    });
});

// ENDPOINT: Recibir una nueva orden (El botón "Enviar" de la tablet)
router.post('/order', (req, res) => {
    const { order_type, payment_method, total, items, driver_id, customer_name, customer_phone, user_id } = req.body;
    
    // 1. La PC es el embudo: Registra la orden y auto-genera el Ticket #
    db.run(
        `INSERT INTO orders (ticket_number, order_type, payment_method, total, driver_id, user_id) 
         VALUES ((SELECT IFNULL(MAX(ticket_number), 0) + 1 FROM orders), ?, ?, ?, ?, ?)`,
        [order_type, payment_method, total, driver_id, user_id || null],
        function(err) {
            if (err) return res.status(500).json({ error: "Error al guardar orden: " + err.message });
            
            const newOrderId = this.lastID;
            
            // 2. Extraemos el Número de Ticket que se acaba de crear (Ej. 001)
            db.get("SELECT ticket_number FROM orders WHERE id = ?", [newOrderId], (err, row) => {
                const ticketNumber = row.ticket_number;
                
                // 3. MANDAR A IMPRIMIR A LA LOPEN 🖨️
                db.get("SELECT printer_type, printer_ip FROM settings WHERE id = 1", (err, settingsRow) => {
                    printerService.printTicket(ticketNumber, req.body, settingsRow);
                });
                
                // 4. Sincronización en Tiempo Real: Avisarle a todas las tablets que hubo una venta
                req.io.emit('new_order', { ticketNumber, total });

                // 5. Responderle a la Tablet que la misión fue un éxito
                res.json({ 
                    success: true, 
                    ticket_number: ticketNumber, 
                    message: 'Orden enviada a cocina e impresa exitosamente.' 
                });
            });
        }
    );
});

// ENDPOINT: Obtener historial y resumen estadístico completo (Dashboard)
router.get('/orders', (req, res) => {
    const period = req.query.period || 'day';
    
    let dateCondition = "1=1";
    let chartGroup = "";
    let chartSelect = "";
    
    if (period === 'day') {
        dateCondition = "date(datetime(created_at, 'localtime')) = date('now', 'localtime')";
        chartSelect = "strftime('%H:00', datetime(created_at, 'localtime')) as name";
        chartGroup = "strftime('%H', datetime(created_at, 'localtime'))";
    } else if (period === 'week') {
        // En SQLite 'now', 'weekday 0' etc se puede usar para la semana. 
        // Una forma sencilla es usar el número de semana del año (%W)
        dateCondition = "strftime('%W', datetime(created_at, 'localtime')) = strftime('%W', 'now', 'localtime') AND strftime('%Y', datetime(created_at, 'localtime')) = strftime('%Y', 'now', 'localtime')";
        // Devolvemos el día de la semana (0-6) o simplemente la fecha
        chartSelect = "date(datetime(created_at, 'localtime')) as name";
        chartGroup = "date(datetime(created_at, 'localtime'))";
    } else if (period === 'month') {
        dateCondition = "strftime('%Y-%m', datetime(created_at, 'localtime')) = strftime('%Y-%m', 'now', 'localtime')";
        chartSelect = "date(datetime(created_at, 'localtime')) as name";
        chartGroup = "date(datetime(created_at, 'localtime'))";
    } else if (period === 'all') {
        dateCondition = "1=1";
        chartSelect = "strftime('%Y-%m', datetime(created_at, 'localtime')) as name";
        chartGroup = "strftime('%Y-%m', datetime(created_at, 'localtime'))";
    }

    // 1. Resumen de KPIs
    const kpiQuery = `
        SELECT 
            IFNULL(SUM(total), 0) as total_sales, 
            COUNT(*) as total_tickets,
            IFNULL(AVG(total), 0) as avg_ticket
        FROM orders 
        WHERE ${dateCondition}
    `;

    // 2. Datos para la Gráfica
    const chartQuery = `
        SELECT 
            ${chartSelect}, 
            SUM(total) as sales 
        FROM orders 
        WHERE ${dateCondition}
        GROUP BY ${chartGroup}
        ORDER BY name ASC
    `;

    // 3. Órdenes con nombre de usuario (para Historial)
    const ordersQuery = `
        SELECT o.*, u.username as worker_name 
        FROM orders o 
        LEFT JOIN users u ON o.user_id = u.id 
        ORDER BY o.created_at DESC
    `;

    // 4. Lista de trabajadores (para filtros)
    const workersQuery = "SELECT id, username as name FROM users";

    db.get(kpiQuery, [], (err, summary) => {
        if (err) return res.status(500).json({ error: err.message });
        
        db.all(chartQuery, [], (err, chartData) => {
            if (err) return res.status(500).json({ error: err.message });

            db.all(ordersQuery, [], (err, orders) => {
                if (err) return res.status(500).json({ error: err.message });
                
                db.all(workersQuery, [], (err, workers) => {
                    res.json({ 
                        summary: summary || { total_sales: 0, total_tickets: 0, avg_ticket: 0 }, 
                        chartData: chartData || [],
                        orders: orders || [],
                        workers: workers || []
                    });
                });
            });
        });
    });
});

// ENDPOINT: Crear un nuevo plato desde la administración (Soporta imagen desde PC)
router.post('/products', upload.single('image'), (req, res) => {
    const { name, category_id, price, selling_type, bg_color } = req.body;
    
    let image_url = null;
    if (req.file) {
        image_url = `/uploads/${req.file.filename}`;
    }

    db.run(
        "INSERT INTO products (name, category_id, price, selling_type, bg_color, image_url, is_available) VALUES (?, ?, ?, ?, ?, ?, 1)",
        [name, category_id || null, price, selling_type || 'UNIT', bg_color || '#334155', image_url],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, id: this.lastID });
        }
    );
});

// ENDPOINT: Crear categoría
router.post('/categories', (req, res) => {
    const { name, bg_color } = req.body;
    db.run("INSERT INTO categories (name, bg_color) VALUES (?, ?)", [name, bg_color], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, id: this.lastID });
    });
});

// ENDPOINT: Eliminar Categoría (Borrado Lógico)
router.delete('/categories/:id', (req, res) => {
    db.run("UPDATE products SET category_id = NULL WHERE category_id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        db.run("UPDATE categories SET active = 0 WHERE id = ?", [req.params.id], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
    });
});

// ENDPOINT: Crear extra con opciones
router.post('/extras', (req, res) => {
    const { name, options } = req.body;
    db.run("INSERT INTO extras (name) VALUES (?)", [name], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        const extraId = this.lastID;
        const stmt = db.prepare("INSERT INTO extra_options (extra_id, name, price) VALUES (?, ?, ?)");
        options.forEach(opt => stmt.run([extraId, opt.name, opt.price]));
        stmt.finalize(() => res.json({ success: true, id: extraId }));
    });
});

// ENDPOINT: Eliminar extra (Borrado Lógico)
router.delete('/extras/:id', (req, res) => {
    db.run("UPDATE extras SET active = 0 WHERE id = ?", [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// ENDPOINT: Crear Descuento
router.post('/discounts', (req, res) => {
    const { name, type, value } = req.body;
    db.run("INSERT INTO discounts (name, type, value) VALUES (?, ?, ?)", [name, type, value], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, id: this.lastID });
    });
});

// ENDPOINT: Eliminar Descuento (Borrado Lógico)
router.delete('/discounts/:id', (req, res) => {
    db.run("UPDATE discounts SET active = 0 WHERE id = ?", [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// ENDPOINT: Eliminar Producto (Borrado Lógico)
router.delete('/products/:id', (req, res) => {
    db.run("UPDATE products SET active = 0 WHERE id = ?", [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// ENDPOINT: Editar Producto
router.put('/products/:id', upload.single('image'), (req, res) => {
    const { name, price, category_id, selling_type, bg_color, clear_image } = req.body;
    
    if (req.file) {
        const imageUrl = `/uploads/${req.file.filename}`;
        db.run(`UPDATE products SET name=?, price=?, category_id=?, selling_type=?, bg_color=NULL, image_url=? WHERE id=?`, 
            [name, price, category_id || null, selling_type, imageUrl, req.params.id], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
    } else if (clear_image === 'true' || bg_color) {
        db.run(`UPDATE products SET name=?, price=?, category_id=?, selling_type=?, bg_color=?, image_url=NULL WHERE id=?`, 
            [name, price, category_id || null, selling_type, bg_color || null, req.params.id], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
    } else {
        db.run(`UPDATE products SET name=?, price=?, category_id=?, selling_type=? WHERE id=?`, 
            [name, price, category_id || null, selling_type, req.params.id], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
    }
});


// ENDPOINT: Obtener Cajeros (No devuelve al ADMIN por seguridad ni inactivos)
router.get('/users', (req, res) => {
    db.all("SELECT id, username, pin_code, active, role FROM users WHERE role = 'CASHIER' AND active = 1", [], (err, users) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ users });
    });
});

// ENDPOINT: Crear Cajero
router.post('/users', (req, res) => {
    const { username, pin_code } = req.body;
    
    // Regla: No se puede usar un PIN que ya tenga un CAJERO ACTIVO. (El Admin va aparte)
    db.get("SELECT id FROM users WHERE pin_code = ? AND role = 'CASHIER' AND active = 1", [pin_code], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (row) return res.status(400).json({ error: "Este PIN ya está en uso por otro empleado." });
        
        db.run("INSERT INTO users (username, pin_code, role, active) VALUES (?, ?, 'CASHIER', 1)", [username, pin_code], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, id: this.lastID });
        });
    });
});

// ENDPOINT: Eliminar Cajero (Desactivación Permanente)
router.delete('/users/:id', (req, res) => {
    db.run("UPDATE users SET active = 0 WHERE id = ? AND role = 'CASHIER'", [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// ENDPOINT: Obtener Configuraciones
router.get('/settings', (req, res) => {
    db.get("SELECT * FROM settings WHERE id = 1", [], (err, settings) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ settings });
    });
});

// ENDPOINT: Guardar Configuraciones
router.put('/settings', (req, res) => {
    const { business_name, address, phone, ticket_message, printer_type, printer_ip } = req.body;
    db.run(
        `UPDATE settings SET business_name=?, address=?, phone=?, ticket_message=?, printer_type=?, printer_ip=? WHERE id=1`,
        [business_name, address, phone, ticket_message, printer_type, printer_ip],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        }
    );
});

// ENDPOINT: Cambiar PIN del Administrador Maestro
router.put('/admin-pin', (req, res) => {
    const { new_pin } = req.body;
    if (!new_pin || new_pin.length !== 4) return res.status(400).json({ error: "El PIN debe tener 4 dígitos" });
    
    // El PIN del admin ya no choca con los cajeros, se puede poner cualquiera
    db.run("UPDATE users SET pin_code = ? WHERE role = 'ADMIN'", [new_pin], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// ENDPOINT: Obtener PIN del Administrador Maestro
router.get('/admin-pin', (req, res) => {
    db.get("SELECT pin_code FROM users WHERE role = 'ADMIN'", [], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: "Admin no encontrado" });
        res.json({ pin: row.pin_code });
    });
});

// ENDPOINT: Obtener la IP de la red local (Para conectar las tablets)
router.get('/network-info', (req, res) => {
    let localIp = '127.0.0.1';
    const interfaces = os.networkInterfaces();
    
    for (const devName in interfaces) {
        const iface = interfaces[devName];
        for (let i = 0; i < iface.length; i++) {
            const alias = iface[i];
            if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
                localIp = alias.address;
                break;
            }
        }
    }
    
    res.json({ ip: localIp });
});

// ENDPOINT: Obtener lista de impresoras instaladas en Windows
router.get('/windows-printers', (req, res) => {
    // Usamos PowerShell para listar impresoras
    const command = `powershell.exe -Command "Get-Printer | Select-Object Name | ConvertTo-Json"`;
    
    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error("Error al obtener impresoras:", error);
            return res.json({ printers: [] });
        }
        try {
            const data = JSON.parse(stdout);
            // Puede ser un objeto o un array de objetos
            let printers = [];
            if (Array.isArray(data)) {
                printers = data.map(p => p.Name);
            } else if (data && data.Name) {
                printers = [data.Name];
            }
            res.json({ printers });
        } catch (e) {
            console.error("Error parseando impresoras:", e);
            res.json({ printers: [] });
        }
    });
});

// ENDPOINT: Login con PIN
router.post('/auth', (req, res) => {
    const { pin, role } = req.body;
    if (!pin || !role) return res.status(400).json({ error: "PIN y Rol requeridos" });
    
    // Buscar usuario por PIN y Rol (solo activos)
    db.get("SELECT id, username, role FROM users WHERE pin_code = ? AND role = ? AND active = 1", [pin, role], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(401).json({ error: "PIN incorrecto" });
        
        res.json({ success: true, user: row });
    });
});

module.exports = router;

