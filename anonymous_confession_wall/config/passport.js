// ─────────────────────────────────────────────────
// config/passport.js — Google OAuth Strategy
// Handles what happens when a user logs in with Google
// ─────────────────────────────────────────────────
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

module.exports = function (passport) {

   
    passport.use(new GoogleStrategy(
        {
            clientID:     process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL:  '/auth/google/callback',
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
              
                let user = await User.findOne({ googleId: profile.id });

                if (!user) {
                   
                    user = await User.create({
                        googleId:    profile.id,
                        displayName: profile.displayName,
                        photo:       profile.photos?.[0]?.value || '',
                    });
                }

                return done(null, user); 
            } catch (err) {
                return done(err, null);  
            }
        }
    ));

    // ── Serialize ───────────────────────────────────
    // After login: save just the user's DB _id into the session cookie
    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    // ── Deserialize ─────────────────────────────────
    // On every request: read the _id from the cookie,
    // fetch the full user from DB and put it into req.user
    passport.deserializeUser(async (id, done) => {
        try {
            const user = await User.findById(id);
            done(null, user);
        } catch (err) {
            done(err, null);
        }
    });
};
