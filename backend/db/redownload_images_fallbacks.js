const path = require('path');
const fs = require('fs');

const uploadsDir = path.join(__dirname, '..', 'uploads');

const fallbackUrls = {
    2: 'https://images.unsplash.com/photo-1541592102481-c150b07b8b20?auto=format&fit=crop&w=800&q=80',
    3: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=800&q=80',
    4: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=800&q=80',
    12: 'https://images.unsplash.com/photo-1534353473418-4cfa6c56fd38?auto=format&fit=crop&w=800&q=80'
};

async function downloadImages() {
    console.log("Iniciando re-descarga de fallos...");
    for (const i of [2, 3, 4, 12]) {
        const destPath = path.join(uploadsDir, `seed_product_${i}.jpg`);
        try {
            const response = await fetch(fallbackUrls[i], {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const buffer = await response.arrayBuffer();
            fs.writeFileSync(destPath, Buffer.from(buffer));
            console.log(`✅ Imagen ${i} descargada correctamente (${buffer.byteLength} bytes).`);
        } catch (error) {
            console.error(`❌ Error descargando imagen ${i}:`, error.message);
        }
    }
}

downloadImages();
