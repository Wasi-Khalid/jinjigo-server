const express = require('express');
const { scheduleInterview } = require('../controllers/interviewController');
const router = express.Router();
const passport = require('passport');

router.post('/schedule', passport.authenticate('jwt', { session: false }), scheduleInterview);

module.exports = router;
