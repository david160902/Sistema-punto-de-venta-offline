const fs = require('fs');
let code = fs.readFileSync('routes/shiftRoutes.js', 'utf8');

const newEndpoint = `
// GET /: Get all shifts history
router.get('/', (req, res) => {
    db.all("SELECT s.*, u.username as worker_name FROM cash_shifts s LEFT JOIN users u ON s.user_id = u.id ORDER BY s.id DESC", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});
module.exports = router;
`;

code = code.replace('module.exports = router;', newEndpoint);
fs.writeFileSync('routes/shiftRoutes.js', code);
console.log('Endpoint added');
