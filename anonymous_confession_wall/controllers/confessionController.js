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

const getMoodForecast = async (req, res) => {
    try {
        const recentConfessions = await Confession
            .find()
            .sort({ createdAt: -1 })
            .limit(20)
            .select('text tags reactions')
            .lean();

        if (recentConfessions.length === 0) {
            return res.json({ forecast: "Clear skies. No secrets on the horizon yet." });
        }

        const confessionTexts = recentConfessions.map(c => {
             const likes = (c.reactions?.like || 0) + (c.reactions?.love || 0) + (c.reactions?.laugh || 0);
             const viralTag = likes > 5 ? ' [VIRAL!]' : '';
             return `[${c.tags[0] || 'General'}${viralTag}]: ${c.text}`;
        }).join('\n');
        
        const prompt = `
        You are a witty campus weather reporter. Based on these recent student confessions, give a short, funny 1-sentence weather forecast for the campus mood. 
        Pay extra attention to posts marked [VIRAL!] as they represent the dominant mood.
        Use metaphors like "heavy showers of regret", "sunny spells of romance", "high pressure exams", etc.
        keep it under 20 words.

        Confessions:
        ${confessionTexts}
        `;

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messages: [
                    { role: 'system', content: 'You are a helpful assistant.' },
                    { role: 'user', content: prompt }
                ],
                model: 'llama-3.3-70b-versatile',
                temperature: 0.7,
                max_tokens: 100
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Groq API Error Details:', errorText);
            throw new Error(`Groq API Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const forecast = data.choices[0]?.message?.content?.trim() || "Cloudy with a chance of secrets.";

        res.json({ forecast });

    } catch (err) {
        console.error('AI Forecast Error:', err);
        res.json({ forecast: "Weather system offline. Try looking out the window." });
    }
};

const getConfessions = async (req, res) => {
    try {
        const confessions = await Confession
            .find()
            .select('-secretCode')
            .sort({ createdAt: -1 })
            .lean();
        res.json(confessions);
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
    const allowed = ['like', 'love', 'laugh'];

    if (!allowed.includes(reactionType))
        return res.status(400).json({ error: `Reaction must be one of: ${allowed.join(', ')}` });

    try {
        const confession = await Confession.findById(req.params.id);

        if (!confession)
            return res.status(404).json({ error: 'Confession not found.' });

        confession.reactions[reactionType] += 1;
        await confession.save();

        res.json(confession);
    } catch (err) {
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
    getMoodForecast,
};

module.exports = {
    getConfessions,
    getMyConfessions,
    createConfession,
    updateConfession,
    deleteConfession,
    reactToConfession,
    getMoodForecast,
};
