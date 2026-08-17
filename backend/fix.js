const fs = require('fs');
let code = fs.readFileSync('routes/posRoutes.js', 'utf8');

const start = code.indexOf('// ENDPOINT: Recibir o actualizar una orden');
const end = code.indexOf('// ENDPOINT: Obtener historial y resumen estadístico completo');

const before = code.substring(0, start);
const after = code.substring(end);

const newHandler = `// ENDPOINT: Recibir o actualizar una orden (Mandar a Cocina o Cobrar)
router.post('/order', (req, res) => {
    console.log("REQUEST BODY:", req.body);
    const { order_id, order_type, payment_method, total, items, driver_id, customer_name, customer_phone, user_id, table_id, status } = req.body;
    const currentStatus = status || 'PAGADA'; 

    db.get("SELECT id FROM cash_shifts WHERE status = 'OPEN' ORDER BY id DESC LIMIT 1", (err, shiftRow) => {
        const currentShiftId = shiftRow ? shiftRow.id : null;

        if (order_id) {
            db.run(
                \`UPDATE orders SET order_type = ?, payment_method = ?, total = ?, driver_id = ?, user_id = ?, table_id = ?, status = ?, shift_id = COALESCE(shift_id, ?) WHERE id = ?\`,
                [order_type, payment_method || 'PENDIENTE', total, driver_id || null, user_id || null, table_id || null, currentStatus, currentShiftId, order_id],
                function(err) {
                    if (err) return res.status(500).json({ error: "Error al actualizar orden: " + err.message });
                    
                    db.run(\`DELETE FROM order_items WHERE order_id = ?\`, [order_id], (err) => {
                        if (items && items.length > 0) {
                            const stmt = db.prepare(\`INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal, notes) VALUES (?, ?, ?, ?, ?, ?)\`);
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
                \`INSERT INTO orders (ticket_number, order_type, payment_method, total, driver_id, user_id, table_id, status, shift_id, created_at) 
                 VALUES ((SELECT IFNULL(MAX(ticket_number), 0) + 1 FROM orders), ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))\`,
                [order_type, payment_method || 'PENDIENTE', total, driver_id || null, user_id || null, table_id || null, currentStatus, currentShiftId],
                function(err) {
                    if (err) return res.status(500).json({ error: "Error al guardar orden: " + err.message });
                    
                    const newOrderId = this.lastID;
                    
                    if (items && items.length > 0) {
                        const stmt = db.prepare(\`INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal, notes) VALUES (?, ?, ?, ?, ?, ?)\`);
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

`;

fs.writeFileSync('routes/posRoutes.js', before + newHandler + after);
console.log('Done!');
