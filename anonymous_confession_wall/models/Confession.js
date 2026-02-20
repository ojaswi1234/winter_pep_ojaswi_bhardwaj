
const mongoose = require('mongoose');

const ConfessionSchema = new mongoose.Schema({
    
    text: { type: String, required: true, trim: true },

    // Password chosen by the user at post time — used to edit/delete later
    secretCode: { type: String, required: true, minlength: 4 },

   
    tags: { type: [String], default: [] },

   
    reactions: {
        upvote:   { type: Number, default: 0 },
        downvote: { type: Number, default: 0 },
        love:     { type: Number, default: 0 },
        laugh:    { type: Number, default: 0 },
    },

    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    createdAt: { type: Date, default: Date.now },
});


ConfessionSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Confession', ConfessionSchema);
