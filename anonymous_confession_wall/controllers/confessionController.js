const Confession = require('../models/Confession');

const getMyConfessions = async (req, res) => {
    try {
        const confessions = await Confession
            .find({ userId: req.user.id })
            .select('-secretCode')
            .sort({ createdAt: -1 })
            .lean();
        res.json(confessions);
    } catch (err) {
        res.status(500).json({ error: 'Could not load your confessions.' });
    }
};



const getConfessions = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        
        const confessions = await Confession
            .find()
            .select('-secretCode')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();
            
        const totalConfessions = await Confession.countDocuments();
        const totalPages = Math.ceil(totalConfessions / limit);
        
        res.json({
            confessions,
            pagination: {
                currentPage: page,
                totalPages,
                totalConfessions,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        });
    } catch (err) {
        res.status(500).json({ error: 'Could not load confessions.' });
    }
};

const createConfession = async (req, res) => {
    const { text, secretCode, tags } = req.body;

    if (!text || !text.trim())
        return res.status(400).json({ error: 'Confession text cannot be empty.' });
    if (!secretCode || secretCode.length < 4)
        return res.status(400).json({ error: 'Secret code must be at least 4 characters.' });

    try {
        const confession = await Confession.create({
            text:       text.trim(),
            secretCode: secretCode,
            tags:       tags || [],
            userId:     req.user.id,
        });

        res.status(201).json(confession);
    } catch (err) {
        res.status(500).json({ error: 'Could not save confession.' });
    }
};

const updateConfession = async (req, res) => {
    const { secretCode, text } = req.body;

    if (!text || !text.trim())
        return res.status(400).json({ error: 'New text cannot be empty.' });

    try {
        const confession = await Confession.findById(req.params.id);

        if (!confession)
            return res.status(404).json({ error: 'Confession not found.' });

        if (confession.secretCode !== secretCode)
            return res.status(401).json({ error: 'Wrong secret code.' });

        confession.text = text.trim();
        await confession.save();

        res.json(confession);
    } catch (err) {
        res.status(500).json({ error: 'Could not update confession.' });
    }
};

const deleteConfession = async (req, res) => {
    const { secretCode } = req.body;

    try {
        const confession = await Confession.findById(req.params.id);

        if (!confession)
            return res.status(404).json({ error: 'Confession not found.' });

        if (confession.secretCode !== secretCode)
            return res.status(401).json({ error: 'Wrong secret code.' });

        await confession.deleteOne();
        res.json({ message: 'Confession deleted.' });
    } catch (err) {
        res.status(500).json({ error: 'Could not delete confession.' });
    }
};

const reactToConfession = async (req, res) => {
    const { reactionType } = req.body;
    const allowed = ['upvote', 'downvote', 'love', 'laugh'];

    if (!allowed.includes(reactionType))
        return res.status(400).json({ error: `Reaction must be one of: ${allowed.join(', ')}` });

    try {
        const confession = await Confession.findById(req.params.id);

        if (!confession)
            return res.status(404).json({ error: 'Confession not found.' });
            
        // ensure initialization if missing in old documents 
        if(!confession.reactions) confession.reactions = {};
        if(typeof confession.reactions[reactionType] !== 'number') confession.reactions[reactionType] = 0;

        confession.reactions[reactionType] += 1;
        
        // Mark modified because we might be modifying a nested property that mongoose didn't track perfectly if dynamic
        confession.markModified('reactions'); 
        
        await confession.save();

        res.json(confession);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Could not save reaction.' });
    }
};

module.exports = {
    getConfessions,
    getMyConfessions,
    createConfession,
    updateConfession,
    deleteConfession,
    reactToConfession,
};
