const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
    hr: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    candidateName: { type: String, required: true },
    candidateEmail: { type: String, required: true },
    candidatePosition: { type: String, required: true },
    currentEmployer: { type: String },
    intervieweeInfoURL: { type: String },
    interviewerEmails: [{ type: String, required: true }],
    interviewType: { type: String, required: true },
    interviewPosition: { type: String, required: true },
    interviewDuration: { type: Number, required: true },
    startTime: { type: Date },
    endTime: { type: Date },
    summary: { type: String, required: true },
    description: { type: String, required: true },
    candidateEmailTemplate: { type: mongoose.Schema.Types.ObjectId, ref: 'EmailTemplate', required: true },
    interviewerEmailTemplate: { type: mongoose.Schema.Types.ObjectId, ref: 'EmailTemplate', required: true },
    feedbackFile: { type: String },
    feedbackDeadline: { type: Number, required: true },
    feedbackNotificationFrequency: { type: Number, required: true },
    escalationEmail: { type: String },
    escalationDeadline: { type: Number, required: true },
    notes: { type: String },
    scheduleOrder: [{ type: String, required: true }],
    schedulingMethod: { type: String, enum: ['flexible', 'fixed'], required: true },
    proposedDates: [{ type: Date }],
    status: { type: String, enum: ['initialized', 'proposed', 'finalized', 'conducted', 'feedback_collected'], default: 'initialized' },
    calendarEventId: { type: String },
    scheduledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Interview', interviewSchema);
