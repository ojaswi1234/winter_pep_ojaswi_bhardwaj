// ─────────────────────────────────────────────────
// server.js — Entry Point
// Loads config → connects DB → starts the server
// ─────────────────────────────────────────────────
require('dotenv').config({ path: './config/config.env' });

const app       = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 3000;

// First connect to MongoDB, then start listening
connectDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`✅ Server running at http://localhost:${PORT}`);
        });
    })
    .catch((err) => {
        console.error('❌ Failed to connect to MongoDB:', err.message);
        process.exit(1);
    });
