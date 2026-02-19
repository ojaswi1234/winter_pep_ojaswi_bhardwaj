// ─────────────────────────────────────────────────
// models/User.js — User Schema
// Represents a user who signed in with Google
// ─────────────────────────────────────────────────
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    googleId:    { type: String, required: true, unique: true }, // Google's unique ID for this person
    displayName: { type: String, required: true },               // Full name from Google
    photo:       { type: String, default: '' },                  // Profile picture URL from Google
    createdAt:   { type: Date,   default: Date.now },
});

module.exports = mongoose.model('User', UserSchema);
