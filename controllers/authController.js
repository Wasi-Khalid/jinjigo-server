const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const passport = require('passport');
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

async function signup(req, res) {
    try {
        const { username, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({ username, email, password: hashedPassword });
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token, user: { _id: user._id, username: user.username, email: user.email } });
    } catch (error) {
        console.error('Error signing up:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

async function login(req, res) {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token, user: { _id: user._id, username: user.username, email: user.email } });
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

const loginWithGoogle = (req, res, next) => {
    passport.authenticate('google', { scope: ['profile', 'email', 'https://www.googleapis.com/auth/calendar'] })(req, res, next);
};

const googleCallback = (req, res) => {
    const token = req.user.token;
    res.redirect(`http://localhost:5174/login?token=${token}`);
};

const logout = (req, res) => {
    req.logout((err) => {
        if (err) return next(err);
        res.redirect('/');
    });
};

const validateGoogleToken = async (req, res) => {
    const { token } = req.body;
    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const user = await User.findOne({ googleId: payload.sub });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const jwtToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token: jwtToken, user });
    } catch (error) {
        console.error('Error validating Google token:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = { signup, login, loginWithGoogle, googleCallback, logout, validateGoogleToken };
