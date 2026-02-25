const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const bcrypt = require('bcryptjs');

module.exports = function(passport) {
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID || 'MOCK_GOOGLE_CLIENT_ID',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'MOCK_GOOGLE_CLIENT_SECRET',
        callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback'
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            const email = profile.emails && profile.emails[0] && profile.emails[0].value;
            if (!email) return done(new Error('No email found from Google'), null);

            let user = await User.findOne({ email });
            if (!user) {
                // Create a random password for accounts created via Google
                const randomPassword = Math.random().toString(36).slice(-12);
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(randomPassword, salt);

                user = new User({
                    username: profile.displayName || email.split('@')[0],
                    email,
                    password: hashedPassword
                });

                await user.save();
            }

            return done(null, user);
        } catch (err) {
            return done(err, null);
        }
    }));
};
