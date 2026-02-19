// ─────────────────────────────────────────────────
// routes/confessionRoutes.js — Confession Routes
// All routes starting with /confessions
// ─────────────────────────────────────────────────
const express     = require('express');
const router      = express.Router();
const { ensureAuth } = require('../middlewares/auth');
const {
    getConfessions,
    getMyConfessions,
    createConfession,
    updateConfession,
    deleteConfession,
    reactToConfession,
    getMoodForecast, // Added
} = require('../controllers/confessionController');

// Public — anyone can read all confessions
router.get('/', getConfessions);

// Public — AI Forecast
router.get('/forecast', getMoodForecast);

// Protected — returns only the logged-in user's own confessions
router.get('/mine', ensureAuth, getMyConfessions);

// Protected — must be logged in to post a new confession
router.post('/', ensureAuth, createConfession);

// Secret-code protected — no login needed, but must know the secret code
router.put('/:id',    updateConfession);
router.delete('/:id', deleteConfession);

// Public — anyone can react (like/love/laugh)
router.post('/:id/react', reactToConfession);

module.exports = router;
