// ─────────────────────────────────────────────────
// routes/authRoutes.js — Authentication Routes
// All routes starting with /auth
// ─────────────────────────────────────────────────
const express  = require('express');
const passport = require('passport');
const router   = express.Router();

// Step 1 — Redirect user to Google's login page
router.get('/google',
    passport.authenticate('google', { scope: ['profile'] })
);

// Step 2 — Google redirects back here after the user approves
router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/' }),
    (req, res) => {
        res.redirect('/'); // Login successful → go home
    }
);

// Logout — clears the session and sends user home
router.get('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);
        res.redirect('/');
    });
});

// Returns the currently logged-in user as JSON
// Frontend calls this on page load to check login status
// Returns {} if nobody is logged in
router.get('/current_user', (req, res) => {
    res.json(req.user || {});
});

module.exports = router;
