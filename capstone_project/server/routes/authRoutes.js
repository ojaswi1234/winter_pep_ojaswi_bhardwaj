const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getUser } = require('../controllers/authController');
const auth = require('../middleware/auth');

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

module.exports = router;