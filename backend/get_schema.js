const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('db/pos.db');
db.all("SELECT sql FROM sqlite_master WHERE type='table'", (err, rows) => {
    console.log(JSON.stringify(rows, null, 2));
});
