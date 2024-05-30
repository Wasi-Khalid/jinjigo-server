const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const passport = require('passport');

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/google', authController.loginWithGoogle);
router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/' }), authController.googleCallback);
router.get('/logout', authController.logout);
router.post('/validate-google-token', authController.authenticateUserWithToken);
router.put('/update-user', passport.authenticate('jwt', { session: false }), authController.updateUser);
router.get('/user/:id', passport.authenticate('jwt', { session: false }), authController.getUser);

module.exports = router;
