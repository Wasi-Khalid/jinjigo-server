const express = require('express');
const passport = require('passport');
const {
    scheduleInterview,
    proposeNewDates,
    confirmFinalDate,
    rescheduleInterview,
    cancelInterview,
    getInterviewsByUser,
    getSingleInterviewById,
    getInterviewStatus,
    updateCandidateResponse,
    collectFeedback,
    nextActionDecision,
    getAllInterviews
} = require('../controllers/interviewController');
const router = express.Router();

router.post('/schedule', passport.authenticate('jwt', { session: false }), scheduleInterview);
router.patch('/reschedule', passport.authenticate('jwt', { session: false }), rescheduleInterview);
router.delete('/cancel', passport.authenticate('jwt', { session: false }), cancelInterview);
router.post('/user-interviews', passport.authenticate('jwt', { session: false }), getInterviewsByUser);
router.post('/single-interview', passport.authenticate('jwt', { session: false }), getSingleInterviewById);
router.post('/status', passport.authenticate('jwt', { session: false }), getInterviewStatus);
router.post('/response', passport.authenticate('jwt', { session: false }), updateCandidateResponse);
router.post('/feedback', passport.authenticate('jwt', { session: false }), collectFeedback);
router.post('/next-action', passport.authenticate('jwt', { session: false }), nextActionDecision);
router.post('/propose-dates', passport.authenticate('jwt', { session: false }), proposeNewDates);
router.post('/confirm-final-date', passport.authenticate('jwt', { session: false }), confirmFinalDate);
router.get('/all-interviews', passport.authenticate('jwt', { session: false }), getAllInterviews);

module.exports = router;
