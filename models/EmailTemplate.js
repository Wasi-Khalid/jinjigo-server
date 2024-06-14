const mongoose = require('mongoose');

const emailTemplateSchema = new mongoose.Schema({
    name: { type: String, required: true, maxlength: 100 },
    title: { type: String, required: true, maxlength: 200 },
    content: { type: String, required: true, maxlength: 2000 },
    type: { type: String, enum: ['candidate', 'interviewer'], required: true },
    placeholders: [{ type: String }]
}, { timestamps: true });

module.exports = mongoose.model('EmailTemplate', emailTemplateSchema);