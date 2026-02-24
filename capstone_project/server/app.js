const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to database
// Note: Ensure you have a running MongoDB instance or update .env with a valid URI
// If not using MongoDB yet, comment out connectDB()
connectDB();

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

// app.use('/api/auth', require('./routes/authRoutes'));

// Socket.io Setup
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

// Socket.io Logic
const roomUsers = {};
const userRooms = {}; // Track which room each socket is in

// Clean up empty rooms
const cleanupEmptyRooms = () => {
    for (const roomId in roomUsers) {
        if (roomUsers[roomId].length === 0) {
            delete roomUsers[roomId];
        }
    }
};

io.on('connection', (socket) => {
    console.log(`User Connected: ${socket.id}`);

    // Join Room
    socket.on('join-room', (data) => {
        // Validate input
        if (!data || !data.roomId || !data.username || typeof data.roomId !== 'string' || typeof data.username !== 'string') {
            socket.emit('error', { message: 'Invalid room data' });
            return;
        }

        const { roomId, username } = data;
        
        // Leave previous room if any
        if (userRooms[socket.id]) {
            socket.leave(userRooms[socket.id]);
        }
        
        socket.join(roomId);
        userRooms[socket.id] = roomId;
        
        // Add user to room list (prevent duplicates)
        if (!roomUsers[roomId]) roomUsers[roomId] = [];
        
        // Check if user already exists in room
        const existingUserIndex = roomUsers[roomId].findIndex(u => u.id === socket.id);
        if (existingUserIndex === -1) {
            roomUsers[roomId].push({ id: socket.id, username });
        }
        
        console.log(`User ${username} joined room: ${roomId}`);
        
        // Notify others in room
        socket.to(roomId).emit('user-joined', { username, id: socket.id });
        
        // Send current users in room to the new user
        socket.emit('room-users', roomUsers[roomId].filter(u => u.id !== socket.id));
    });

    // Handle Drawing
    socket.on('draw', (data) => {
        // Validate input
        if (!data || !data.roomId || typeof data.x0 !== 'number' || typeof data.y0 !== 'number') {
            return; // Silently ignore invalid data
        }
        // Broadcast drawing data to other users in the room
        socket.to(data.roomId).emit('draw', data);
    });

    // Handle Clear Board
    socket.on('clear-board', (data) => {
        // Validate input
        if (!data || !data.roomId) {
            return;
        }
        io.in(data.roomId).emit('clear', data);
    });

    // Handle Cursor Movement (with basic rate limiting built into client)
    socket.on('cursor-move', (data) => {
        // Validate input
        if (!data || !data.roomId || typeof data.x !== 'number' || typeof data.y !== 'number') {
            return;
        }
        // Broadcast cursor position to other users in the room
        socket.to(data.roomId).emit('cursor-move', {
            ...data,
            userId: socket.id
        });
    });

    // Handle Cursor Leave
    socket.on('cursor-leave', (data) => {
        // Validate input
        if (!data || !data.roomId) {
            return;
        }
        // Notify others that this user's cursor left the canvas
        socket.to(data.roomId).emit('cursor-leave', {
            userId: socket.id,
            pageId: data.pageId
        });
    });

    // Handle Chat Message
    socket.on('chat-message', (data) => {
        // Validate input
        if (!data || !data.roomId || !data.text || typeof data.text !== 'string') {
            return;
        }
        // Sanitize message (basic - prevent excessively long messages)
        if (data.text.length > 1000) {
            data.text = data.text.substring(0, 1000);
        }
        // Broadcast to everyone in the room INCLUDING the sender
        io.in(data.roomId).emit('chat-message', data);
    });

    socket.on('disconnect', () => {
        console.log('User Disconnected', socket.id);
        
        const roomId = userRooms[socket.id];
        
        // Remove user from their room
        if (roomId && roomUsers[roomId]) {
            const index = roomUsers[roomId].findIndex(u => u.id === socket.id);
            if (index !== -1) {
                roomUsers[roomId].splice(index, 1);
                io.to(roomId).emit('user-left', socket.id);
            }
        }
        
        // Clean up user room tracking
        delete userRooms[socket.id];
        
        // Clean up empty rooms periodically
        cleanupEmptyRooms();
    });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
