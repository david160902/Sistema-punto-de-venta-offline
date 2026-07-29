const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const path = require('path');

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

// Middlewares
app.use(cors());
app.use(express.json());

// Servir la Interfaz de Usuario (Frontend empaquetado)
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Inyectar la variable 'io' en las rutas para que la API pueda mandar mensajes a las tablets
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Configurar Rutas
app.use('/api/pos', posRoutes);

// Fallback para React Router: Cualquier ruta no reconocida por la API va al index.html
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Escuchar conexiones de las tablets
io.on('connection', (socket) => {
    console.log(`[Network] Nueva conexion entrante de cliente: ${socket.id}`);
    
    socket.on('disconnect', () => {
        console.log(`[Network] Cliente desconectado: ${socket.id}`);
    });
});

const PORT = 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n========================================`);
    console.log(`  SISTEMA POS - SERVICIO BACKEND INICIADO `);
    console.log(`========================================`);
    console.log(`[Sistema] Base de datos SQLite conectada.`);
    console.log(`[Sistema] Servidor API escuchando en el puerto ${PORT}.`);
    console.log(`[Sistema] Listo para recibir conexiones entrantes...`);
});
