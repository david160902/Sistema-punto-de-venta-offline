const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const posRoutes = require('./routes/posRoutes');

const app = express();
const server = http.createServer(app);

// Configuración de WebSockets (Socket.io) para la sincronización de las tablets
const io = new Server(server, {
    cors: {
        origin: "*", // Permitir que cualquier tablet en la red local se conecte
        methods: ["GET", "POST"]
    }
});

const path = require('path');

// Middlewares
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Inyectar la variable 'io' en las rutas para que la API pueda mandar mensajes a las tablets
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Configurar Rutas
app.use('/api/pos', posRoutes);

// Escuchar conexiones de las tablets
io.on('connection', (socket) => {
    console.log(`[📡 Sincronización] Nueva tablet/pantalla conectada: ${socket.id}`);
    
    socket.on('disconnect', () => {
        console.log(`[📡 Sincronización] Tablet desconectada: ${socket.id}`);
    });
});

const PORT = 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n========================================`);
    console.log(`🚀 SERVIDOR POS "EL CEREBRO" INICIADO`);
    console.log(`========================================`);
    console.log(`💻 Base de datos en línea.`);
    console.log(`📡 Esperando conexión de tablets en el puerto ${PORT}...`);
});
