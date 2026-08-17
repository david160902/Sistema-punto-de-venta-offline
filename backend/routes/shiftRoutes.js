const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../db/pos.db');
const db = new sqlite3.Database(dbPath);

// Helper function to calculate current shift totals
const getShiftTotals = (shiftId) => {
    return new Promise((resolve, reject) => {
        db.get(`
            SELECT 
                IFNULL(SUM(CASE WHEN payment_method = 'EFECTIVO' THEN total ELSE 0 END), 0) as cash_sales,
                IFNULL(SUM(CASE WHEN payment_method = 'YAPE' THEN total ELSE 0 END), 0) as yape_sales,
                IFNULL(SUM(CASE WHEN payment_method = 'TARJETA' THEN total ELSE 0 END), 0) as card_sales,
                IFNULL(SUM(total), 0) as total_sales,
                COUNT(id) as total_orders
            FROM orders WHERE shift_id = ? AND status = 'PAGADA'
        `, [shiftId], (err, sales) => {
            if(err) return reject(err);

            db.get(`
                SELECT 
                    IFNULL(SUM(CASE WHEN type = 'PAY_IN' THEN amount ELSE 0 END), 0) as pay_ins,
                    IFNULL(SUM(CASE WHEN type = 'PAY_OUT' THEN amount ELSE 0 END), 0) as pay_outs
                FROM cash_movements WHERE shift_id = ?
            `, [shiftId], (err, moves) => {
                if(err) return reject(err);
                
                resolve({
                    ...sales,
                    ...moves
                });
            });
        });
    });
};

// GET /current: Return the currently open shift (or null)
router.get('/current', (req, res) => {
    db.get("SELECT * FROM cash_shifts WHERE status = 'OPEN' ORDER BY id DESC LIMIT 1", async (err, shift) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!shift) return res.json(null);
        
        try {
            const totals = await getShiftTotals(shift.id);
            res.json({ ...shift, totals });
        } catch(e) {
            res.status(500).json({ error: e.message });
        }
    });
});

// POST /open: Open a new shift
router.post('/open', (req, res) => {
    const { user_id, starting_cash } = req.body;
    db.get("SELECT id FROM cash_shifts WHERE status = 'OPEN'", (err, row) => {
        if(err) return res.status(500).json({ error: err.message });
        if(row) return res.status(400).json({ error: 'Ya existe un turno abierto.' });
        
        db.run(`INSERT INTO cash_shifts (user_id, starting_cash) VALUES (?, ?)`, [user_id, starting_cash || 0], function(err) {
            if(err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, message: 'Turno abierto exitosamente' });
        });
    });
});

// POST /movements: Add money or withdraw money
router.post('/movements', (req, res) => {
    const { shift_id, user_id, type, amount, reason } = req.body;
    db.run(`INSERT INTO cash_movements (shift_id, user_id, type, amount, reason) VALUES (?, ?, ?, ?, ?)`, 
        [shift_id, user_id, type, amount, reason], function(err) {
        if(err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, message: 'Movimiento registrado' });
    });
});

// POST /close: Close current shift
router.post('/close', async (req, res) => {
    const { shift_id, actual_cash } = req.body;
    
    try {
        const shift = await new Promise((resolve, reject) => {
            db.get("SELECT * FROM cash_shifts WHERE id = ?", [shift_id], (err, row) => {
                if(err) reject(err); else resolve(row);
            });
        });
        
        if(!shift || shift.status !== 'OPEN') return res.status(400).json({ error: 'Turno no válido o ya cerrado' });
        
        const totals = await getShiftTotals(shift_id);
        const expected_cash = shift.starting_cash + totals.cash_sales + totals.pay_ins - totals.pay_outs;
        const difference = actual_cash - expected_cash;
        
        db.run(`UPDATE cash_shifts SET status = 'CLOSED', end_time = CURRENT_TIMESTAMP, expected_cash = ?, actual_cash = ?, difference = ? WHERE id = ?`, 
            [expected_cash, actual_cash, difference, shift_id], (err) => {
            if(err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Turno cerrado exitosamente', expected_cash, difference });
        });
        
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /movements/:shiftId
router.get('/movements/:shiftId', (req, res) => {
    db.all(`SELECT m.*, u.username as worker_name FROM cash_movements m LEFT JOIN users u ON m.user_id = u.id WHERE m.shift_id = ? ORDER BY m.created_at DESC`, [req.params.shiftId], (err, rows) => {
        if(err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});


// GET /: Get all shifts history
router.get('/', (req, res) => {
    db.all("SELECT s.*, u.username as worker_name FROM cash_shifts s LEFT JOIN users u ON s.user_id = u.id ORDER BY s.id DESC", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});
module.exports = router;

