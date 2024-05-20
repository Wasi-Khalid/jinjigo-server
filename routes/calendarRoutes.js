const express = require('express');
const { listEvents, createEvent } = require('../controllers/calendarController');

const router = express.Router();

router.get('/events', listEvents);
router.post('/events', createEvent);

module.exports = router;
