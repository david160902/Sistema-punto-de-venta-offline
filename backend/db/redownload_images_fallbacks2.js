const path = require('path');
const fs = require('fs');

const uploadsDir = path.join(__dirname, '..', 'uploads');

async function downloadImages() {
    const destPath = path.join(uploadsDir, `seed_product_2.jpg`);
    const response = await fetch('https://images.unsplash.com/photo-1588677610668-3e5f03dce6bf?auto=format&fit=crop&w=800&q=80', {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    const buffer = await response.arrayBuffer();
    fs.writeFileSync(destPath, Buffer.from(buffer));
    console.log(`✅ Imagen 2 arreglada correctamente.`);
}

downloadImages();
