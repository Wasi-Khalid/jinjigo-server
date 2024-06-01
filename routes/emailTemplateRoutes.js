const express = require('express');
const passport = require('passport');
const {
    createTemplate,
    updateTemplate,
    deleteTemplate,
    getAllTemplates,
    getTemplateById
} = require('../controllers/emailTemplateController');
const router = express.Router();

router.post('/create', passport.authenticate('jwt', { session: false }), createTemplate);
router.patch('/update', passport.authenticate('jwt', { session: false }), updateTemplate);
router.delete('/delete', passport.authenticate('jwt', { session: false }), deleteTemplate);
router.get('/all', passport.authenticate('jwt', { session: false }), getAllTemplates);
router.post('/single', passport.authenticate('jwt', { session: false }), getTemplateById);

module.exports = router;
