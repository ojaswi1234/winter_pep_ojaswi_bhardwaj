const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// configure google strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback'
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // find or create user based on google profile
      let user = await User.findOne({ googleId: profile.id });
      if (!user) {
        const email = profile.emails && profile.emails[0] && profile.emails[0].value;
        user = await User.findOne({ email });
        if (!user) {
          user = new User({
            username: profile.displayName || email,
            email,
            password: '', // no local password
            googleId: profile.id
          });
        } else {
          user.googleId = profile.id;
        }
        await user.save();
      }

      // sign jwt token manually and attach to object returned by passport
      const payload = { user: { id: user.id } };
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

      // pass token in user object so callback handler can access it
      done(null, { token });
    } catch (err) {
      done(err, null);
    }
  }
));

// passport serialize/deserialize (required even though we're not using sessions)
passport.serializeUser((obj, done) => {
  done(null, obj);
});
passport.deserializeUser((obj, done) => {
  done(null, obj);
});
