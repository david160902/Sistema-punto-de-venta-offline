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
const db = new sqlite3.Database(dbPath, (err) => {
    if (!err) {
        db.run('PRAGMA journal_mode = WAL;');
    }
});

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

// ENDPOINT: Obtener orden por ID
router.get('/order/:id', (req, res) => {
    const orderId = req.params.id;
    db.get("SELECT * FROM orders WHERE id = ?", [orderId], (err, order) => {
        if (err || !order) return res.status(404).json({ error: "Orden no encontrada" });
        db.all("SELECT oi.*, p.name FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?", [orderId], (err, items) => {
            order.items = items || [];
            res.json(order);
        });
    });
});

// ENDPOINT: Obtener estado de las mesas (Salón)
router.get('/active-tables', (req, res) => {
    db.all("SELECT * FROM tables WHERE active = 1 ORDER BY id ASC", [], (err, tables) => {
        if (err) return res.status(500).json({ error: err.message });
        
        // Buscar órdenes ABIERTAS asignadas a mesas
        db.all("SELECT id, table_id, total, created_at FROM orders WHERE status = 'ABIERTA' AND table_id IS NOT NULL", [], (err, openOrders) => {
            if (err) return res.status(500).json({ error: err.message });
            
            const ordersByTable = {};
            openOrders.forEach(o => ordersByTable[o.table_id] = o);
            
            const tablesWithStatus = tables.map(t => ({
                ...t,
                current_order: ordersByTable[t.id] || null
            }));
            
            res.json(tablesWithStatus);
        });
    });
});

// ENDPOINT: Recibir o actualizar una orden (Mandar a Cocina o Cobrar)
router.post('/order', (req, res) => {
    console.log("REQUEST BODY:", req.body);
    const { order_id, order_type, payment_method, total, items, driver_id, customer_name, customer_phone, user_id, table_id, status } = req.body;
    const currentStatus = status || 'PAGADA'; 

    db.get("SELECT id FROM cash_shifts WHERE status = 'OPEN' ORDER BY id DESC LIMIT 1", (err, shiftRow) => {
        const currentShiftId = shiftRow ? shiftRow.id : null;

        if (order_id) {
            db.run(
                `UPDATE orders SET order_type = ?, payment_method = ?, total = ?, driver_id = ?, user_id = ?, table_id = ?, status = ?, shift_id = COALESCE(shift_id, ?) WHERE id = ?`,
                [order_type, payment_method || 'PENDIENTE', total, driver_id || null, user_id || null, table_id || null, currentStatus, currentShiftId, order_id],
                function(err) {
                    if (err) return res.status(500).json({ error: "Error al actualizar orden: " + err.message });
                    
                    db.run(`DELETE FROM order_items WHERE order_id = ?`, [order_id], (err) => {
                        if (items && items.length > 0) {
                            const stmt = db.prepare(`INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal, notes) VALUES (?, ?, ?, ?, ?, ?)`);
                            items.forEach(item => {
                                stmt.run([order_id, item.id, item.qty, item.price, item.qty * item.price, item.notes || null]);
                            });
                            stmt.finalize();
                        }

                        db.get("SELECT ticket_number FROM orders WHERE id = ?", [order_id], (err, row) => {
                            const ticketNumber = row.ticket_number;
                            
                            if (currentStatus === 'PAGADA') {
                                db.get("SELECT * FROM settings WHERE id = 1", (err, settingsRow) => {
                                    printerService.printTicket(ticketNumber, req.body, settingsRow);
                                });
                            }
                            
                            req.io.emit('new_order', { ticketNumber, total, status: currentStatus, table_id });

                            res.json({ 
                                success: true, 
                                ticket_number: ticketNumber,
                                order_id: order_id,
                                message: currentStatus === 'ABIERTA' ? 'Orden enviada a cocina.' : 'Orden cobrada exitosamente.'
                            });
                        });
                    });
                }
            );
        } else {
            db.run(
                `INSERT INTO orders (ticket_number, order_type, payment_method, total, driver_id, user_id, table_id, status, shift_id, created_at) 
                 VALUES ((SELECT IFNULL(MAX(ticket_number), 0) + 1 FROM orders), ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))`,
                [order_type, payment_method || 'PENDIENTE', total, driver_id || null, user_id || null, table_id || null, currentStatus, currentShiftId],
                function(err) {
                    if (err) return res.status(500).json({ error: "Error al guardar orden: " + err.message });
                    
                    const newOrderId = this.lastID;
                    
                    if (items && items.length > 0) {
                        const stmt = db.prepare(`INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal, notes) VALUES (?, ?, ?, ?, ?, ?)`);
                        items.forEach(item => {
                            stmt.run([newOrderId, item.id, item.qty, item.price, item.qty * item.price, item.notes || null]);
                        });
                        stmt.finalize();
                    }
                    
                    db.get("SELECT ticket_number FROM orders WHERE id = ?", [newOrderId], (err, row) => {
                        const ticketNumber = row.ticket_number;
                        
                        if (currentStatus === 'PAGADA') {
                            db.get("SELECT * FROM settings WHERE id = 1", (err, settingsRow) => {
                                printerService.printTicket(ticketNumber, req.body, settingsRow);
                            });
                        }
                        
                        req.io.emit('new_order', { ticketNumber, total, status: currentStatus, table_id });

                        res.json({ 
                            success: true, 
                            ticket_number: ticketNumber,
                            order_id: newOrderId,
                            message: currentStatus === 'ABIERTA' ? 'Orden enviada a cocina.' : 'Orden cobrada exitosamente.'
                        });
                    });
                }
            );
        }
    });
});

// ENDPOINT: Obtener historial y resumen estadístico completo (Dashboard)
router.get('/orders', (req, res) => {
    const period = req.query.period || 'month';
    const specificDate = req.query.date; // e.g. "2026-08-11"
    const specificMonth = req.query.month; // e.g. "2026-08"
    const startDate = req.query.startDate; // e.g. "2026-08-01"
    const endDate = req.query.endDate; // e.g. "2026-08-11"
    
    let dateCondition = "1=1";
    let chartGroup = "";
    let chartSelect = "";
    
    // NOTA: created_at ya está guardado en localtime
    if (startDate && endDate) {
        dateCondition = `date(created_at) BETWEEN '${startDate}' AND '${endDate}'`;
        chartSelect = "date(created_at) as name";
        chartGroup = "date(created_at)";
    } else if (specificDate) {
        dateCondition = `date(created_at) = '${specificDate}'`;
        chartSelect = "strftime('%H:00', created_at) as name";
        chartGroup = "strftime('%H', created_at)";
    } else if (specificMonth) {
        dateCondition = `strftime('%Y-%m', created_at) = '${specificMonth}'`;
        chartSelect = "date(created_at) as name";
        chartGroup = "date(created_at)";
    } else if (period === 'day') {
        dateCondition = "date(created_at) = date('now', 'localtime')";
        chartSelect = "strftime('%H:00', created_at) as name";
        chartGroup = "strftime('%H', created_at)";
    } else if (period === 'week') {
        dateCondition = "strftime('%W', created_at) = strftime('%W', 'now', 'localtime') AND strftime('%Y', created_at) = strftime('%Y', 'now', 'localtime')";
        chartSelect = "date(created_at) as name";
        chartGroup = "date(created_at)";
    } else if (period === 'month') {
        dateCondition = "strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now', 'localtime')";
        chartSelect = "date(created_at) as name";
        chartGroup = "date(created_at)";
    } else if (period === 'all') {
        dateCondition = "1=1";
        chartSelect = "strftime('%Y-%m', created_at) as name";
        chartGroup = "strftime('%Y-%m', created_at)";
    }

    const kpiQuery = `
        SELECT 
            IFNULL(SUM(CASE WHEN status = 'PAGADA' THEN total ELSE 0 END), 0) as total_sales, 
            IFNULL(SUM(CASE WHEN status = 'PAGADA' THEN 1 ELSE 0 END), 0) as total_tickets,
            IFNULL(AVG(CASE WHEN status = 'PAGADA' THEN total ELSE NULL END), 0) as avg_ticket,
            IFNULL(SUM(CASE WHEN status = 'ABIERTA' THEN total ELSE 0 END), 0) as total_pending
        FROM orders 
        WHERE ${dateCondition}
    `;

    const chartQuery = `
        SELECT 
            ${chartSelect}, 
            SUM(total) as sales 
        FROM orders 
        WHERE ${dateCondition} AND status = 'PAGADA'
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

    // 4. Lista de trabajadores activos (sin administradores, para filtros)
    const workersQuery = "SELECT id, username as name FROM users WHERE active = 1 AND role != 'ADMIN'";

    // 5. Lista de platos más vendidos (Top 5)
    const topProductsQuery = `
        SELECT p.name as product_name, SUM(oi.quantity) as total_sold
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        JOIN products p ON oi.product_id = p.id
        WHERE ${dateCondition.replace(/created_at/g, 'o.created_at')} AND o.status = 'PAGADA'
        GROUP BY p.id
        ORDER BY total_sold DESC
        LIMIT 5
    `;

    db.get(kpiQuery, [], (err, summary) => {
        if (err) return res.status(500).json({ error: err.message });
        
        db.all(chartQuery, [], (err, chartData) => {
            if (err) return res.status(500).json({ error: err.message });

            db.all(ordersQuery, [], (err, orders) => {
                if (err) return res.status(500).json({ error: err.message });
                
                db.all(workersQuery, [], (err, workers) => {
                    if (err) return res.status(500).json({ error: err.message });
                    
                    db.all(topProductsQuery, [], (err, topProducts) => {
                        res.json({ 
                            summary: summary || { total_sales: 0, total_tickets: 0, avg_ticket: 0, total_pending: 0 }, 
                            chartData: chartData || [],
                            orders: orders || [],
                            workers: workers || [],
                            topProducts: topProducts || []
                        });
                    });
                });
            });
        });
    });
});

// ENDPOINT: Obtener detalle de un recibo específico
router.get('/orders/:id', (req, res) => {
    const orderId = req.params.id;
    
    // Obtener la cabecera de la orden
    db.get(`
        SELECT o.*, u.username as worker_name, t.name as table_name
        FROM orders o 
        LEFT JOIN users u ON o.user_id = u.id 
        LEFT JOIN tables t ON o.table_id = t.id
        WHERE o.id = ?
    `, [orderId], (err, order) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!order) return res.status(404).json({ error: 'Recibo no encontrado' });

        // Obtener los productos (items) de la orden
        db.all(`
            SELECT oi.*, p.name as product_name
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = ?
        `, [orderId], (err, items) => {
            if (err) return res.status(500).json({ error: err.message });
            
            order.items = items || [];
            res.json(order);
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
router.put('/settings', upload.single('logo'), (req, res) => {
    const { business_name, address, phone, ticket_message, printer_type, printer_ip, remove_logo } = req.body;
    
    // Si hay un archivo subido, usamos su nombre, si remove_logo es true, lo borramos (null)
    const logoFile = req.file ? req.file.filename : (remove_logo === 'true' ? null : undefined);

    let query = `UPDATE settings SET business_name=?, address=?, phone=?, ticket_message=?, printer_type=?, printer_ip=?`;
    let params = [business_name, address, phone, ticket_message, printer_type, printer_ip];

    if (logoFile !== undefined) {
        query += `, logo=?`;
        params.push(logoFile);
    }
    
    query += ` WHERE id=1`;

    db.run(query, params, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, logo: logoFile });
    });
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

// ENDPOINT: Obtener Métodos de Pago
router.get('/payment-methods', (req, res) => {
    db.all("SELECT * FROM payment_methods WHERE active = 1", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// ENDPOINT: Agregar Método de Pago
router.post('/payment-methods', (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Nombre requerido" });
    db.run("INSERT INTO payment_methods (name) VALUES (?)", [name], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, name, active: 1 });
    });
});

// ENDPOINT: Desactivar Método de Pago
router.delete('/payment-methods/:id', (req, res) => {
    db.run("UPDATE payment_methods SET active = 0 WHERE id = ?", [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// ENDPOINT: Obtener Motorizados
router.get('/drivers', (req, res) => {
    db.all("SELECT * FROM drivers WHERE is_active = 1", [], (err, drivers) => {
        if (err) return res.status(500).json({ error: err.message });
        
        db.all("SELECT * FROM orders WHERE status = 'ABIERTA' AND driver_id IS NOT NULL", [], (err, openOrders) => {
            if (err) return res.status(500).json({ error: err.message });
            
            const driversWithStatus = drivers.map(d => ({
                ...d,
                current_orders: openOrders.filter(o => o.driver_id === d.id)
            }));
            
            res.json(driversWithStatus);
        });
    });
});

// ENDPOINT: Agregar Motorizado
router.post('/drivers', (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Nombre requerido" });
    db.run("INSERT INTO drivers (name) VALUES (?)", [name], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, name, is_active: 1 });
    });
});

// ENDPOINT: Desactivar Motorizado
router.delete('/drivers/:id', (req, res) => {
    db.run("UPDATE drivers SET is_active = 0 WHERE id = ?", [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// ENDPOINT: Obtener Mesas
router.get('/tables', (req, res) => {
    db.all("SELECT * FROM tables WHERE active = 1", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// ENDPOINT: Agregar Mesa
router.post('/tables', (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Nombre de mesa requerido" });
    db.run("INSERT INTO tables (name) VALUES (?)", [name], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, name, active: 1 });
    });
});

// ENDPOINT: Editar Mesa
router.put('/tables/:id', (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Nombre de mesa requerido" });
    db.run("UPDATE tables SET name = ? WHERE id = ?", [name, req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// ENDPOINT: Eliminar/Desactivar Mesa
router.delete('/tables/:id', (req, res) => {
    db.run("UPDATE tables SET active = 0 WHERE id = ?", [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

module.exports = router;

