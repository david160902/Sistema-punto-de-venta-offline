const path = require('path');
const fs = require('fs');

async function fixImage() {
    const destPath = path.join(__dirname, '..', 'uploads', 'seed_product_2.jpg');
    
    // Usamos dummyimage.com que es 100% confiable y sin bloqueos anti-bot
    const url = 'https://dummyimage.com/800x600/ef4444/ffffff.jpg&text=Tequenos+Lomo';
    
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const buffer = await response.arrayBuffer();
        fs.writeFileSync(destPath, Buffer.from(buffer));
        console.log(`✅ Imagen 2 arreglada definitivamente (${buffer.byteLength} bytes).`);
    } catch (error) {
        console.error(`❌ Error descargando imagen 2:`, error.message);
    }
}

fixImage();
