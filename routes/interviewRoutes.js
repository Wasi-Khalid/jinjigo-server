const express = require('express');
const passport = require('passport');
const { scheduleInterview, getInterviewsByUser, rescheduleInterview, cancelInterview, collectFeedback, nextActionDecision } = require('../controllers/interviewController');

const router = express.Router();

router.post('/schedule', passport.authenticate('jwt', { session: false }), scheduleInterview);
router.get('/user/:userId', passport.authenticate('jwt', { session: false }), getInterviewsByUser);
router.patch('/reschedule', passport.authenticate('jwt', { session: false }), rescheduleInterview);
router.delete('/cancel', passport.authenticate('jwt', { session: false }), cancelInterview);
router.post('/feedback', passport.authenticate('jwt', { session: false }), collectFeedback);
router.post('/next-action', passport.authenticate('jwt', { session: false }), nextActionDecision);

module.exports = router;
