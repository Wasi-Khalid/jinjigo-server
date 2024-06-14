const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const passport = require('passport');

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/google', passport.authenticate('google', { scope:
        [
            'profile',
            'email', 'https://www.googleapis.com/auth/calendar',
            'https://www.googleapis.com/auth/calendar.events',
            'https://www.googleapis.com/auth/calendar.events.owned',
            'https://www.googleapis.com/auth/gmail.send'
        ],
    accessType: 'offline',
    prompt: 'consent' }
));
router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/' }), authController.googleCallback);
router.get('/logout', authController.logout);
router.post('/validate-google-token', authController.authenticateUserWithToken);
router.put('/update-user', passport.authenticate('jwt', { session: false }), authController.updateUser);
router.get('/user/:id', passport.authenticate('jwt', { session: false }), authController.getUser);

module.exports = router;
