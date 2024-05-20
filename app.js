require('dotenv').config();
require('./jwt/generateKey');
const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const cookieSession = require('cookie-session');
const setupMiddlewares = require('./middlewares/middleware');
const authRoutes = require('./routes/authRoutes');
const calendarRoutes = require('./routes/calendarRoutes');
const db = require('./database/db');
const User = require('./models/User');

// Connect to the database
db.connect();

const app = express();

// Set up passport to use Google OAuth
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.NODE_ENV === 'production'
        ? 'https://jinjigo-server.onrender.com/auth/google/callback'
        : 'http://localhost:3000/auth/google/callback',
}, async (token, tokenSecret, profile, done) => {
    try {
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
            user = new User({
                googleId: profile.id,
                username: profile.displayName,
                email: profile.emails[0].value,
                accessToken: token,
                refreshToken: tokenSecret,
            });
            await user.save();
        } else {
            user.accessToken = token;
            user.refreshToken = tokenSecret;
            await user.save();
        }

        return done(null, user);
    } catch (err) {
        return done(err, null);
    }
}));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

// Use the middleware configuration
setupMiddlewares(app);

app.get('/', (req, res) => {
    res.send('Express Server');
});

app.use('/auth', authRoutes);
app.use('/api/calendar', calendarRoutes);

app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email', 'https://www.googleapis.com/auth/calendar'] }));

app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/' }),
    (req, res) => {
        res.redirect('https://jinjigo.vercel.app'); // Redirect to your React app
    });

app.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) return next(err);
        res.redirect('/');
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
