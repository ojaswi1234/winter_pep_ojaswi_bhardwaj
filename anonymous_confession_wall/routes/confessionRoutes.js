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
} = require('../controllers/confessionController');

router.get('/', getConfessions);

router.get('/mine', ensureAuth, getMyConfessions);

router.post('/', ensureAuth, createConfession);

router.put('/:id',    updateConfession);
router.delete('/:id', deleteConfession);

router.post('/:id/react', reactToConfession);

module.exports = router;
