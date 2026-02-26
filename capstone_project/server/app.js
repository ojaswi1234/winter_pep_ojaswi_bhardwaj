const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const cors = require('cors');
const os = require('os'); // NEW: Required to get system IP
require('dotenv').config();

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

connectDB();

app.use('/api/auth', require('./routes/authRoutes'));

// --- NEW: Endpoint to auto-extract Local Network IP ---
app.get('/api/local-ip', (req, res) => {
    const interfaces = os.networkInterfaces();
    let localIp = 'localhost';
    
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            // Skip internal (localhost) and non-IPv4 addresses
            if (iface.family === 'IPv4' && !iface.internal) {
                localIp = iface.address;
            }
        }
    }
    res.json({ ip: localIp });
});

// 1. INCREASE BUFFER FOR FILE SHARING (100MB)
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] },
    maxHttpBufferSize: 1e8 
});

// Room State
// Structure: { roomId: { hostId: string, users: [], history: [], redoStack: [] } }
const rooms = {}; 

io.on('connection', (socket) => {
    
    // --- ROOM LOGIC (Preserved) ---
    socket.on('create-room', ({ roomId, username }) => {
        rooms[roomId] = {
            hostId: socket.id,
            users: [{ id: socket.id, username }],
            history: [],    // For Undo
            redoStack: []   // For Redo
        };
        socket.join(roomId);
        socket.emit('room-created', { success: true, isHost: true });
        io.to(roomId).emit('room-users', rooms[roomId].users);
    });

    socket.on('request-join', ({ roomId, username }) => {
        const room = rooms[roomId];
        if (!room) {
            socket.emit('join-status', { status: 'error', message: "Room not found." });
            return;
        }
        io.to(room.hostId).emit('user-requesting', { socketId: socket.id, username });
    });

    socket.on('respond-join', ({ socketId, action, roomId }) => {
        if (action === 'accept') {
            const participant = io.sockets.sockets.get(socketId);
            if (participant) {
                participant.join(roomId);
                io.to(socketId).emit('join-status', { status: 'accepted', roomId });
            }
        } else {
            io.to(socketId).emit('join-status', { status: 'rejected' });
        }
    });

    socket.on('join-confirmed', ({ roomId, username }) => {
        if(rooms[roomId]) {
             if (!rooms[roomId].users.find(u => u.id === socket.id)) {
                 rooms[roomId].users.push({ id: socket.id, username });
             }
             io.to(roomId).emit('room-users', rooms[roomId].users);
             io.to(roomId).emit('user-joined', { username, id: socket.id });
             
             // Send existing board history to new user
             socket.emit('board-history', rooms[roomId].history);
        }
    });

    // --- DRAWING & HISTORY (Undo/Redo Preserved) ---
    socket.on('draw', (data) => socket.to(data.roomId).emit('draw', data));

    socket.on('commit-stroke', ({ roomId, stroke }) => {
        if (rooms[roomId]) {
            rooms[roomId].history.push(stroke);
            rooms[roomId].redoStack = []; 
        }
    });

    socket.on('undo', ({ roomId }) => {
        if (rooms[roomId] && rooms[roomId].history.length > 0) {
            const lastAction = rooms[roomId].history.pop();
            rooms[roomId].redoStack.push(lastAction);
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

    socket.on('clear-board', (data) => {
        if (rooms[data.roomId]) {
            rooms[data.roomId].history = [];
            rooms[data.roomId].redoStack = [];
        }
        io.to(data.roomId).emit('clear-board', data);
    });

    // --- MOBILE CONTROLLER (Preserved) ---
    socket.on('mobile-join', ({ targetSocketId }) => {
        console.log(`Mobile controller connected for ${targetSocketId}`);
    });

    socket.on('mobile-command', ({ targetSocketId, command, value }) => {
        io.to(targetSocketId).emit('mobile-command-received', { command, value });
    });

    // --- NEW ADVANCED FEATURES ---

    // 1. File Sharing
    socket.on('upload-file', (data) => {
        io.to(data.roomId).emit('receive-file', data);
    });

    // 2. WebRTC Signaling (Screen Share)
    socket.on('start-screen-share', ({ roomId, userId }) => {
        socket.to(roomId).emit('user-started-sharing', { userId });
    });

    socket.on('stop-screen-share', ({ roomId }) => {
        socket.to(roomId).emit('user-stopped-sharing');
    });

    socket.on('webrtc-offer', (data) => {
        socket.to(data.target).emit('webrtc-offer', {
            sdp: data.sdp,
            callerId: socket.id
        });
    });

    socket.on('webrtc-answer', (data) => {
        socket.to(data.target).emit('webrtc-answer', {
            sdp: data.sdp,
            responderId: socket.id
        });
    });

    socket.on('webrtc-ice-candidate', (data) => {
        socket.to(data.target).emit('webrtc-ice-candidate', {
            candidate: data.candidate,
            senderId: socket.id
        });
    });

    // --- DISCONNECT ---
    socket.on('disconnect', () => {
        for (const roomId in rooms) {
            const room = rooms[roomId];
            const userIndex = room.users.findIndex(u => u.id === socket.id);
            if (userIndex !== -1) {
                const user = room.users[userIndex];
                room.users.splice(userIndex, 1);
                io.to(roomId).emit('user-left', user.id);
                io.to(roomId).emit('room-users', room.users);
                if (socket.id === room.hostId) {
                    delete rooms[roomId]; 
                    io.to(roomId).emit('room-closed');
                }
                break;
            }
        }
    });
    // --- MOBILE CONTROLLER ---
    socket.on('mobile-join', ({ targetSocketId }) => {
        console.log(`Mobile controller connected for ${targetSocketId}`);
    });

    socket.on('mobile-command', ({ targetSocketId, command, value }) => {
        // Relays the command from phone directly to the Desktop
        io.to(targetSocketId).emit('mobile-command-received', { command, value });
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));