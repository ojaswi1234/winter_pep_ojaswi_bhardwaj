// ─────────────────────────────────────────────────
// config/db.js — Database Connection
// Connects to MongoDB using the URI from config.env
// ─────────────────────────────────────────────────
const mongoose = require('mongoose');

const connectDB = async () => {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/confession_wall';
    await mongoose.connect(uri);
    console.log('✅ MongoDB connected');
};

module.exports = connectDB;
