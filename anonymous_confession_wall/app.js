const express  = require('express');
const session  = require('express-session');
const passport = require('passport');
const path     = require('path');

require('./config/passport')(passport);

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(session({
    secret:            process.env.SESSION_SECRET || 'fallback_secret',
    resave:            false,
    saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(express.static(path.join(__dirname, 'public')));

app.use('/auth',        require('./routes/authRoutes'));
app.use('/confessions', require('./routes/confessionRoutes'));

module.exports = app;

module.exports = app;
