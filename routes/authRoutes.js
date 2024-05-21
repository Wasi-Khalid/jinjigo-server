const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const passport = require('passport');

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/google', authController.loginWithGoogle);
router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/' }), authController.googleCallback);
router.get('/logout', authController.logout);

module.exports = router;
