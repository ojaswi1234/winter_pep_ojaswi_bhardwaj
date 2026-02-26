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
    cors: { origin: "*", methods: ["GET", "POST"] },
    maxHttpBufferSize: 1e8 // Increase buffer for file uploads (100MB)
});

const rooms = {}; 

io.on('connection', (socket) => {
    // --- ROOM LOGIC ---
    socket.on('create-room', ({ roomId, username }) => {
        rooms[roomId] = {
            hostId: socket.id,
            users: [{ id: socket.id, username }] 
        };
        socket.join(roomId);
        socket.emit('room-created', { success: true, isHost: true });
        io.to(roomId).emit('room-users', rooms[roomId].users);
    });

    socket.on('request-join', ({ roomId, username }) => {
        const room = rooms[roomId];
        if (!room) {
            socket.emit('join-status', { status: 'error', message: "Room not found or host is offline." });
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
        }
    });

    // --- INTERACTION BROADCASTS ---
    socket.on('draw', (data) => socket.to(data.roomId).emit('draw', data));
    socket.on('clear-board', (data) => io.to(data.roomId).emit('clear-board', data));
    socket.on('send-message', (data) => io.to(data.roomId).emit('receive-message', data));
    socket.on('mouse-move', (data) => socket.to(data.roomId).emit('mouse-move', data));

    // --- NEW FEATURES SIGNALING ---

    // 1. File Sharing
    socket.on('upload-file', (data) => {
        // Broadcast file to room
        io.to(data.roomId).emit('receive-file', data);
    });

    // 2. WebRTC Signaling (Screen Share)
    // When a user starts sharing, they send 'start-screen-share'
    socket.on('start-screen-share', ({ roomId, userId }) => {
        socket.to(roomId).emit('user-started-sharing', { userId });
    });

    socket.on('stop-screen-share', ({ roomId }) => {
        socket.to(roomId).emit('user-stopped-sharing');
    });

    // Standard WebRTC Signaling: Offer, Answer, ICE Candidates
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
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));