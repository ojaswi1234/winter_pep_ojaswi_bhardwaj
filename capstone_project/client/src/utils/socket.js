import { io } from 'socket.io-client';

// For development, assume backend runs on port 5000
const URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

export const socket = io(URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000
});

// Connection event handlers
socket.on('connect', () => {
  console.log('Connected to server:', socket.id);
});

socket.on('disconnect', (reason) => {
  console.log('Disconnected from server:', reason);
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
});

socket.on('reconnect', (attemptNumber) => {
  console.log('Reconnected after', attemptNumber, 'attempts');
});

socket.on('reconnect_failed', () => {
  console.error('Failed to reconnect to server');
});