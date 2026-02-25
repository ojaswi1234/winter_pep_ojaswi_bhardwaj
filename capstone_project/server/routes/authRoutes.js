const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getUser } = require('../controllers/authController');
const auth = require('../middleware/auth');
const passport = require('passport');
const jwt = require('jsonwebtoken');

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

// @route   GET api/auth/google
// @desc    Authenticate with Google
// @access  Public
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// @route   GET api/auth/google/callback
// @desc    Google auth callback
// @access  Public
router.get('/google/callback', passport.authenticate('google', { session: false, failureRedirect: process.env.CLIENT_URL || 'http://localhost:5173/login' }), (req, res) => {
	try {
		// Create token for the authenticated user
		const payload = { user: { id: req.user.id } };
		const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

		// Redirect back to client with token as query param
		const redirectUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/auth/success?token=${token}`;
		res.redirect(redirectUrl);
	} catch (err) {
		console.error('Google callback error', err);
		res.redirect(process.env.CLIENT_URL || 'http://localhost:5173/login');
	}
});

module.exports = router;