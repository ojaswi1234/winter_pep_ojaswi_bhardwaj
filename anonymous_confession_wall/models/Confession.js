// ─────────────────────────────────────────────────
// models/Confession.js — Confession Schema
// Represents a single anonymous secret/confession
// ─────────────────────────────────────────────────
const mongoose = require('mongoose');

const ConfessionSchema = new mongoose.Schema({
    // The actual confession text
    text: { type: String, required: true, trim: true },

    // Password chosen by the user at post time — used to edit/delete later
    secretCode: { type: String, required: true, minlength: 4 },

    // Mood tags like ["Crush", "Funny"]
    tags: { type: [String], default: [] },

    // Reaction counters
    reactions: {
        like:  { type: Number, default: 0 },
        love:  { type: Number, default: 0 },
        laugh: { type: Number, default: 0 },
    },

    // Reference to the User who posted this
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    createdAt: { type: Date, default: Date.now },
});

// Index on createdAt so .sort({ createdAt: -1 }) is fast
// Without this, MongoDB scans the entire collection on every feed load
ConfessionSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Confession', ConfessionSchema);
