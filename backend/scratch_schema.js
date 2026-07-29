const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('C:/Users/gabo/Desktop/Sistema pos/backend/db/pos.db');
const tables = ['categories', 'products', 'extras', 'extra_options', 'discounts'];
let results = {};
let pending = tables.length;
tables.forEach(table => {
    db.all(`PRAGMA table_info(${table});`, (err, rows) => {
        results[table] = rows.map(r => `${r.name} (${r.type})`);
        pending--;
        if(pending === 0) console.log(JSON.stringify(results, null, 2));
    });
});
