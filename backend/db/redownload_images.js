const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'pos.db');
const db = new sqlite3.Database(dbPath);
const uploadsDir = path.join(__dirname, '..', 'uploads');

const originalUrls = {
    1: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&q=80',
    2: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=800&q=80',
    3: 'https://images.unsplash.com/photo-1548943487-a2e4e43b4859?auto=format&fit=crop&w=800&q=80',
    4: 'https://images.unsplash.com/photo-1594553255157-19ce7dbd0774?auto=format&fit=crop&w=800&q=80',
    5: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=800&q=80',
    6: 'https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&w=800&q=80',
    7: 'https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=800&q=80',
    8: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=800&q=80',
    9: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80',
    10: 'https://images.unsplash.com/photo-1582450871972-ab5ca641643d?auto=format&fit=crop&w=800&q=80',
    11: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=800&q=80',
    12: 'https://images.unsplash.com/photo-1595981267035-7b04d84b4e69?auto=format&fit=crop&w=800&q=80'
};

async function downloadImages() {
    console.log("Iniciando re-descarga con Fetch API...");
    for (let i = 1; i <= 12; i++) {
        const destPath = path.join(uploadsDir, `seed_product_${i}.jpg`);
        try {
            const response = await fetch(originalUrls[i], {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
                }
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const buffer = await response.arrayBuffer();
            fs.writeFileSync(destPath, Buffer.from(buffer));
            console.log(`✅ Imagen ${i} descargada correctamente (${buffer.byteLength} bytes).`);
        } catch (error) {
            console.error(`❌ Error descargando imagen ${i}:`, error.message);
        }
    }
    console.log("¡Re-descarga completada!");
}

downloadImages();
