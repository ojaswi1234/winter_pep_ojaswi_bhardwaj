// ─────────────────────────────────────────────────
// middlewares/auth.js — Authentication Guard
// Use ensureAuth on any route that requires login
// ─────────────────────────────────────────────────

// Blocks the route if the user is not logged in
const ensureAuth = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next(); 
    }
    res.status(401).json({ error: 'You must be logged in to do this.' });
};

module.exports = { ensureAuth };
