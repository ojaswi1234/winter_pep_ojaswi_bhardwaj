// ─────────────────────────────────────────────────
// app.js — App Configuration
// Sets up all middleware and routes
// ─────────────────────────────────────────────────
const express  = require('express');
const session  = require('express-session');
const passport = require('passport');
const path     = require('path');

// Load passport strategy (Google OAuth)
require('./config/passport')(passport);

const app = express();

// ── Body Parsers ────────────────────────────────
// Lets us read JSON and form data from request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ── Sessions ────────────────────────────────────
// Keeps users logged in between page loads using a cookie
app.use(session({
    secret:            process.env.SESSION_SECRET || 'fallback_secret',
    resave:            false,
    saveUninitialized: false,
}));

// ── Passport ────────────────────────────────────
// Reads the session cookie on every request and puts
// the logged-in user into req.user
app.use(passport.initialize());
app.use(passport.session());

// ── Static Files ────────────────────────────────
// Serves index.html, style.css, script.js from /public
app.use(express.static(path.join(__dirname, 'public')));

// ── Routes ──────────────────────────────────────
app.use('/auth',        require('./routes/authRoutes'));
app.use('/confessions', require('./routes/confessionRoutes'));

module.exports = app;
