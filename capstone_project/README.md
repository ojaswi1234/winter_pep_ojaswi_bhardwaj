# Real-Time Collaborative Whiteboard (Capstone Project)

A real-time collaborative whiteboard application built with the MERN Stack (MongoDB, Express.js, React.js, Node.js) and Socket.io. This project allows multiple users to join rooms, draw simultaneously, and chat in real-time.

## Features

- **User Authentication**: Mocked for easy testing (Enter username to join).
- **Real-time Whiteboard**: Draw with multiple users instantly.
- **Tools**: Pencil, Eraser, Clear Board.
- **Customization**: Change brush color and size.
- **Room Management**: Create unique rooms or join existing ones via ID.
- **Chat System**: Real-time chat within rooms.
- **Persistence**: MongoDB used for session storage (optional if testing with mock env).

## Folder Structure

- `client/`: Frontend React application (Vite).
- `server/`: Backend Node.js/Express server (Socket.io).

## Setup Instructions

### Prerequisites
- Node.js installed.
- MongoDB installed and running locally on port 27017 (optional for basic socket features, required for persistence).

### 1. Backend Setup (Server)

Navigate to the server directory:
```bash
cd server
```

Install dependencies:
```bash
npm install
```

Set up environment variables:
- Copy `.env.example` to `.env`.
- Update `MONGO_URI` if needed. Default links to local MongoDB.

Run the server:
```bash
npm run dev
```

Server runs on `http://localhost:5000`.

### 2. Frontend Setup (Client)

Navigate to the client directory:
```bash
cd client
```

Install dependencies:
```bash
npm install
```

Run the client:
```bash
npm run dev
```

Client runs on `http://localhost:5173`.

## Usage
1. Open the client URL.
2. Enter a username and generate a Room ID (or use an existing one).
3. Share the Room ID with another user/browser tab.
4. Draw and chat in real-time!

## Tech Stack
- **Frontend**: React (Vite), Socket.io-client, react-router-dom, CSS.
- **Backend**: Node.js, Express, Socket.io, Mongoose.
- **Database**: MongoDB.
