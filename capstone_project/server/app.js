const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());
connectDB();

app.use('/api/auth', require('./routes/authRoutes'));

// Increase buffer to 100MB for File Sharing
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] },
    maxHttpBufferSize: 1e8 
});

const rooms = {}; 

io.on('connection', (socket) => {
    
    // --- GLOBAL INVITE SYSTEM ---
    socket.on('register-global', (username) => {
        socket.join(`user:${username}`);
    });

    socket.on('send-direct-invite', ({ targetUsername, hostUsername, roomId, type }) => {
        io.to(`user:${targetUsername}`).emit('receive-invite', { hostUsername, roomId, type });
    });

    // --- ROOM MANAGEMENT ---
    socket.on('create-room', ({ roomId, username }) => {
        rooms[roomId] = {
            hostId: socket.id,
            users: [{ id: socket.id, username, isHost: true }], // Added isHost
            history: [],
            redoStack: []
        };
        socket.join(roomId);
        socket.emit('room-created', { success: true, isHost: true });
        io.to(roomId).emit('room-users', rooms[roomId].users);
    });

    socket.on('request-join', ({ roomId, username }) => {
        const room = rooms[roomId];
        if (!room) return socket.emit('join-status', { status: 'error', message: "Room not found." });
        io.to(room.hostId).emit('user-requesting', { socketId: socket.id, username });
    });

    socket.on('respond-join', ({ socketId, action, roomId }) => {
        if (action === 'accept') {
            const client = io.sockets.sockets.get(socketId);
            if (client) {
                client.join(roomId);
                io.to(socketId).emit('join-status', { status: 'accepted', roomId });
            }
        } else {
            io.to(socketId).emit('join-status', { status: 'rejected' });
        }
    });

    socket.on('join-confirmed', ({ roomId, username }) => {
        if(rooms[roomId]) {
             if (!rooms[roomId].users.some(u => u.id === socket.id)) {
                 rooms[roomId].users.push({ id: socket.id, username, isHost: false }); // Added isHost
             }
             io.to(roomId).emit('room-users', rooms[roomId].users);
             io.to(roomId).emit('user-joined', { username, id: socket.id });
             socket.emit('board-history', rooms[roomId].history);
        }
    });

    // --- FEATURE PERMISSION MANAGEMENT ---
    socket.on('request-feature-permission', ({ roomId, username, type }) => {
        const room = rooms[roomId];
        if (room) {
            io.to(room.hostId).emit('feature-permission-request', { socketId: socket.id, username, type });
        }
    });

    socket.on('respond-feature-permission', ({ targetId, action, type }) => {
        io.to(targetId).emit('feature-permission-response', { action, type });
    });

    // --- INTERACTIVE FEATURES (Drawing, Undo/Redo) ---
    socket.on('draw', (data) => socket.to(data.roomId).emit('draw', data));
    
    socket.on('commit-stroke', ({ roomId, stroke }) => {
        if (rooms[roomId]) {
            rooms[roomId].history.push(stroke);
            rooms[roomId].redoStack = [];
        }
    });

    socket.on('undo', ({ roomId }) => {
        if (rooms[roomId] && rooms[roomId].history.length > 0) {
            const action = rooms[roomId].history.pop();
            rooms[roomId].redoStack.push(action);
            io.to(roomId).emit('board-history', rooms[roomId].history);
        }
    });

    socket.on('redo', ({ roomId }) => {
        if (rooms[roomId] && rooms[roomId].redoStack.length > 0) {
            const action = rooms[roomId].redoStack.pop();
            rooms[roomId].history.push(action);
            io.to(roomId).emit('board-history', rooms[roomId].history);
        }
    });

    // --- ADVANCED FEATURES (Files, Screen Share, Signaling) ---
    socket.on('upload-file', (data) => io.to(data.roomId).emit('receive-file', data));

    socket.on('start-screen-share', ({ roomId, userId }) => socket.to(roomId).emit('user-started-sharing', { userId }));
    socket.on('stop-screen-share', ({ roomId }) => socket.to(roomId).emit('user-stopped-sharing'));

    socket.on('webrtc-offer', (data) => socket.to(data.target).emit('webrtc-offer', { sdp: data.sdp, callerId: socket.id }));
    socket.on('webrtc-answer', (data) => socket.to(data.target).emit('webrtc-answer', { sdp: data.sdp, responderId: socket.id }));
    socket.on('webrtc-ice-candidate', (data) => socket.to(data.target).emit('webrtc-ice-candidate', { candidate: data.candidate, senderId: socket.id }));

    socket.on('mouse-move', (data) => socket.to(data.roomId).emit('mouse-move', data));
    socket.on('send-message', (data) => io.to(data.roomId).emit('receive-message', data));

    socket.on('disconnect', () => {
        for (const roomId in rooms) {
            const room = rooms[roomId];
            const userIndex = room.users.findIndex(u => u.id === socket.id);
            if (userIndex !== -1) {
                const user = room.users[userIndex];
                room.users.splice(userIndex, 1);
                io.to(roomId).emit('user-left', { id: user.id, username: user.username });
                io.to(roomId).emit('room-users', room.users);
                if (socket.id === room.hostId) {
                    delete rooms[roomId]; 
                    io.to(roomId).emit('room-closed');
                }
                break;
            }
        }
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));