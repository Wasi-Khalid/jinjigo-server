const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
    hr: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    candidateEmail: { type: String, required: true },
    interviewerEmails: [{ type: String, required: true }],
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    summary: { type: String, required: true },
    description: { type: String, required: true },
    interviewType: { type: String, required: true },
    interviewDuration: { type: Number, required: true },
    candidateEmailTemplate: { type: String, required: true },
    interviewerEmailTemplate: { type: String, required: true },
    feedbackFile: { type: String },
    feedbackDeadline: { type: Number, required: true },
    escalationEmail: { type: String, required: true },
    escalationDeadline: { type: Number, required: true },
    calendarEventId: { type: String },
    scheduledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    feedback: [{ type: String }],
    nextAction: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Interview', interviewSchema);
