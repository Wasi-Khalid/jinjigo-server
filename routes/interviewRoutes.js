const express = require('express');
const passport = require('passport');
const { scheduleInterview, getInterviewsByUser, rescheduleInterview, cancelInterview } = require('../controllers/interviewController');

const router = express.Router();

router.post('/schedule', passport.authenticate('jwt', { session: false }), scheduleInterview);
router.get('/user/:userId', passport.authenticate('jwt', { session: false }), getInterviewsByUser);
router.patch('/:interviewId', passport.authenticate('jwt', { session: false }), rescheduleInterview);
router.delete('/:interviewId', passport.authenticate('jwt', { session: false }), cancelInterview);

module.exports = router;
