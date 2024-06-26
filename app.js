require('dotenv').config(); // Load environment variables
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const authRoutes = require('./routes/authRoutes');
const calendarRoutes = require('./routes/calendarRoutes');
const interviewRoutes = require('./routes/interviewRoutes');
const emailTemplatesRoutes = require('./routes/emailTemplateRoutes');
const db = require('./database/db');

require('./config/passport');

db.connect();

const app = express();

app.use(cors({
    origin: ['https://jinjigo.vercel.app', 'http://localhost:5174'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
}));
app.use(express.json());
app.use(session({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === 'production' }
}));
app.use(passport.initialize());
app.use(passport.session());

app.get('/', (req, res) => {
    res.send('Express Server');
});

app.use('/auth', authRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/email-templates', emailTemplatesRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
