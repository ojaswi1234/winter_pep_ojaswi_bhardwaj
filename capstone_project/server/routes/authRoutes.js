const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getUser } = require('../controllers/authController');
const auth = require('../middleware/auth');

// ensure passport strategies are configured
const passport = require('passport');
require('../config/passport');

// @route   POST api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', registerUser);

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', loginUser);

// @route   GET api/auth/user
// @desc    Get user data
// @access  Private
router.get('/user', auth, getUser);

// --- Google OAuth routes ---
// @route   GET api/auth/google
// @desc    Redirect to Google for authentication
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// @route   GET api/auth/google/callback
// @desc    Google OAuth callback
router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/login', session: false }),
    (req, res) => {
        // passport attaches token to req.user
        const token = req.user && req.user.token;
        // normalize client url the same way as in app.js
        const rawClientUrl = process.env.CLIENT_URL || "http://localhost:5173";
        const normalizedClientUrl = rawClientUrl.endsWith('/') ? rawClientUrl.slice(0, -1) : rawClientUrl;
        if (token) {
            res.redirect(`${normalizedClientUrl}/auth/success?token=${token}`);
        } else {
            res.redirect(normalizedClientUrl + '/login');
        }
    }
);

module.exports = router;