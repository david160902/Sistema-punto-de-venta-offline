const path = require('path');
const fs = require('fs');

async function downloadTequenos() {
    const destPath = path.join(__dirname, '..', 'uploads', 'seed_product_2.jpg');
    
    // Imagen real de Wikimedia Commons (súper confiable y sin bloqueos anti-bots)
    const url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Teque%C3%B1os_2.jpg/800px-Teque%C3%B1os_2.jpg';
    
    try {
        const response = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const buffer = await response.arrayBuffer();
        fs.writeFileSync(destPath, Buffer.from(buffer));
        console.log(`✅ Foto REAL de tequeños descargada (${buffer.byteLength} bytes).`);
    } catch (error) {
        console.error(`❌ Error descargando tequeños:`, error.message);
    }
}

downloadTequenos();
