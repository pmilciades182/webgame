const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');

const app = express();
const server = require('http').createServer(app);

// Configura CORS para Express
app.use(cors({
    origin: true, // Allow all origins in development
    methods: ['GET', 'POST'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
}));


const pool = new Pool({
    connectionString: 'postgres://usuario:contraseña@postgres:5432/mi_juego_db',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000
 });
 

// Middleware para autenticación JWT
app.use((req, res, next) => {
    const token = req.headers['authorization'];
    if (token) {
        jwt.verify(token, 'secreto', (err, decoded) => {
            if (err) return res.status(401).json({ error: 'Token inválido' });
            req.user = decoded;
            next();
        });
    } else {
        next();
    }
});

// Endpoint de prueba para verificar la conexión a la base de datos
app.get('/test-db', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()');
        res.json({ message: 'Conexión a la base de datos exitosa', time: result.rows[0].now });
    } catch (err) {
        console.error('Error al conectar a la base de datos:', err);
        res.status(500).json({ error: 'Error al conectar a la base de datos' });
    }
});

// Ruta de ejemplo
app.get('/', (req, res) => {
    res.send('Backend funcionando');
});

// Configura CORS para WebSocket
const io = require('socket.io')(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    },
    transports: ['websocket']
  });

app.get('/health', (req, res) => {
    res.json({ status: 'ok', socketio: io.engine.clientsCount });
});

io.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
});

// WebSocket
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    socket.emit('connection-status', { status: 'connected' });
  
    socket.on('message', (msg) => {
      io.emit('message', msg);
    });
  });
// Inicia el servidor
server.listen(3000, () => {
    console.log('Servidor backend escuchando en el puerto 3000');
});