import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';

function App() {
    const [dbResponse, setDbResponse] = useState(null);
    const [error, setError] = useState(null);
    const [socketStatus, setSocketStatus] = useState('disconnected');
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        const newSocket = io('http://localhost:3000', {
            transports: ['websocket'],
            pingTimeout: 60000,
            pingInterval: 25000
        });

        // Client-side event listeners
        newSocket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
            setSocketStatus('error');
        });

        newSocket.on('connect', () => {
            console.log('Connected to server');
            setSocketStatus('connected');
            const pingInterval = setInterval(() => {
                newSocket.emit('ping');
            }, 20000);
            
            // Cleanup interval on disconnect
            return () => clearInterval(pingInterval);
        });

        newSocket.on('message', (msg) => {
            console.log('Mensaje recibido:', msg);
            setMessages(prev => [...prev, msg]);
        });

        newSocket.on('disconnect', () => {
            setSocketStatus('disconnected');
        });

        newSocket.on('connection-status', (data) => {
            setSocketStatus(data.status);
        });

        // Remove the server-side socket.io logic that was here

        fetch('http://localhost:3000/test-db')
            .then((response) => response.json())
            .then((data) => setDbResponse(data))
            .catch((err) => setError(err.message));

        setSocket(newSocket);
        return () => newSocket.close(); // Cleanup

    }, []);

    const sendMessage = () => {
        if (socket && message) {
            socket.emit('message', message);
            setMessage('');
        }
    };

    return (
        <div>
            <h1>Juego Web</h1>
            <div>
                {socketStatus === 'disconnected' ? (
                    <p style={{ color: 'red' }}>Desconectado del servidor WebSocket</p>
                ) : error ? (
                    <p style={{ color: 'red' }}>Error: {error}</p>
                ) : dbResponse ? (
                    <div>
                        <p>Mensaje: {dbResponse.message}</p>
                        <p>Hora: {dbResponse.time}</p>
                    </div>
                ) : (
                    <p>Cargando...</p>
                )}
            </div>

            <div style={{ margin: '20px' }}>
                <h3>Chat de Prueba</h3>
                <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Escribe un mensaje"
                />
                <button onClick={sendMessage}>Enviar</button>

                <div style={{ marginTop: '10px' }}>
                    <h4>Mensajes:</h4>
                    {messages.map((msg, index) => (
                        <div key={index}>{msg}</div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default App;