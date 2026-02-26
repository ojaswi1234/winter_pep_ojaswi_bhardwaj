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

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Store room state: { roomId: { hostId: string, users: [{ id, username }] } }
const rooms = {}; 

io.on('connection', (socket) => {
    
    // --- ROOM MANAGEMENT ---

    // 1. Create Room (Host)
    socket.on('create-room', ({ roomId, username }) => {
        rooms[roomId] = {
            hostId: socket.id,
            users: [{ id: socket.id, username }] 
        };
        socket.join(roomId);
        socket.emit('room-created', { success: true, isHost: true });
        
        // Send initial user list to host immediately
        io.to(roomId).emit('room-users', rooms[roomId].users);
        console.log(`Room ${roomId} created by ${username}`);
    });

    // 2. Request to Join (Guest)
    socket.on('request-join', ({ roomId, username }) => {
        const room = rooms[roomId];
        if (!room) {
            socket.emit('join-status', { status: 'error', message: "Room not found or host is offline." });
            return;
        }
        // Notify Host
        io.to(room.hostId).emit('user-requesting', { socketId: socket.id, username });
    });

    // 3. Host Responds
    socket.on('respond-join', ({ socketId, action, roomId }) => {
        if (action === 'accept') {
            const socketToJoin = io.sockets.sockets.get(socketId);
            if (socketToJoin) {
                socketToJoin.join(roomId);
                io.to(socketId).emit('join-status', { status: 'accepted', roomId });
            }
        } else {
            io.to(socketId).emit('join-status', { status: 'rejected' });
        }
    });

    // 4. Join Confirmed (Update Lists)
    socket.on('join-confirmed', ({ roomId, username }) => {
        if(rooms[roomId]) {
             // Prevent duplicates
             const isPresent = rooms[roomId].users.some(u => u.id === socket.id);
             if (!isPresent) {
                 rooms[roomId].users.push({ id: socket.id, username });
             }
             // Broadcast updated list to EVERYONE
             io.to(roomId).emit('room-users', rooms[roomId].users);
             io.to(roomId).emit('user-joined', { username, id: socket.id });
        }
    });

    // --- INTERACTIVE FEATURES ---

    socket.on('draw', (data) => socket.to(data.roomId).emit('draw', data));
    
    socket.on('clear-board', (data) => io.to(data.roomId).emit('clear-board', data));
    
    socket.on('send-message', (data) => io.to(data.roomId).emit('receive-message', data));

    // Interactive Mouse Cursors (Broadcast to others)
    socket.on('mouse-move', (data) => {
        socket.to(data.roomId).emit('mouse-move', data);
    });

    // --- DISCONNECT HANDLING ---
    socket.on('disconnect', () => {
        for (const roomId in rooms) {
            const room = rooms[roomId];
            const userIndex = room.users.findIndex(u => u.id === socket.id);
            
            if (userIndex !== -1) {
                const user = room.users[userIndex];
                room.users.splice(userIndex, 1);
                
                // Notify remaining users (include username for cursor cleanup)
                io.to(roomId).emit('user-left', { id: user.id, username: user.username });
                io.to(roomId).emit('room-users', room.users);
                
                // If Host leaves, close room
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