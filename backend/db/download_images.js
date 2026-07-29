const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const https = require('https');

const dbPath = path.join(__dirname, 'pos.db');
const db = new sqlite3.Database(dbPath);
const uploadsDir = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// Función para descargar imagen
function downloadImage(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            if (response.statusCode === 302 || response.statusCode === 301) {
                // Seguir redirecciones (Unsplash redirecciona)
                https.get(response.headers.location, (res) => {
                    res.pipe(file);
                    file.on('finish', () => {
                        file.close(resolve);
                    });
                }).on('error', reject);
            } else {
                response.pipe(file);
                file.on('finish', () => {
                    file.close(resolve);
                });
            }
        }).on('error', (err) => {
            fs.unlink(dest, () => reject(err));
        });
    });
}

db.serialize(() => {
    db.all("SELECT id, image_url FROM products WHERE image_url LIKE 'http%'", async (err, rows) => {
        if (err) {
            console.error(err);
            return;
        }

        console.log(`Encontradas ${rows.length} imágenes para descargar...`);

        for (const row of rows) {
            const ext = 'jpg'; // Unsplash uses JPEG mostly
            const filename = `seed_product_${row.id}.${ext}`;
            const destPath = path.join(uploadsDir, filename);
            const localUrl = `/uploads/${filename}`;

            try {
                console.log(`Descargando imagen para el producto ${row.id}...`);
                await downloadImage(row.image_url, destPath);
                
                // Actualizar DB
                db.run("UPDATE products SET image_url = ? WHERE id = ?", [localUrl, row.id]);
                console.log(`Producto ${row.id} actualizado a ${localUrl}`);
            } catch (error) {
                console.error(`Error descargando producto ${row.id}:`, error.message);
            }
        }
        
        console.log("¡Todas las imágenes han sido descargadas! El sistema es 100% Offline.");
        db.close();
    });
});
