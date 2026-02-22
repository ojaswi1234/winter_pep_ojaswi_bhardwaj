// ─────────────────────────────────────────────────
// config/db.js — Database Connection
// Connects to MongoDB using the URI from config.env
// ─────────────────────────────────────────────────
const mongoose = require('mongoose');

const connectDB = async () => {
    try{
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/confession_wall';
    await mongoose.connect(uri);
    console.log('MongoDB connected.....');
    } catch(err){
        console.error(err);
        process.exit(1); // Exit with failure
    }
};

module.exports = connectDB;
