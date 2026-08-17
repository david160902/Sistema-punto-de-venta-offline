const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('db/pos.db');

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS cash_shifts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
        end_time DATETIME,
        starting_cash REAL NOT NULL DEFAULT 0.00,
        expected_cash REAL,
        actual_cash REAL,
        difference REAL,
        status TEXT DEFAULT 'OPEN',
        FOREIGN KEY(user_id) REFERENCES users(id)
    )`, (err) => { if(err) console.error(err); else console.log('cash_shifts created'); });

    db.run(`CREATE TABLE IF NOT EXISTS cash_movements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        shift_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        amount REAL NOT NULL,
        reason TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(shift_id) REFERENCES cash_shifts(id),
        FOREIGN KEY(user_id) REFERENCES users(id)
    )`, (err) => { if(err) console.error(err); else console.log('cash_movements created'); });

    db.run(`ALTER TABLE orders ADD COLUMN shift_id INTEGER REFERENCES cash_shifts(id)`, (err) => {
        if(err && !err.message.includes('duplicate column')) console.error(err);
        else console.log('Added shift_id to orders');
    });
});
