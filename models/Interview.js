const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
    hr: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    candidateName: { type: String, required: true },
    candidateEmail: { type: String, required: true },
    candidatePosition: { type: String, required: true },
    candidateCurrentEmployer: { type: String },
    candidateInformationUrl: { type: String },
    interviewers: [{ type: String, required: true }],
    interviewType: { type: String, required: true },
    interviewPosition: { type: String, required: true },
    interviewDuration: { type: Number, required: true },
    interviewStartTime: { type: Date },
    summary: { type: String, required: true },
    description: { type: String, required: true },
    candidateEmailTemplate: { type: mongoose.Schema.Types.ObjectId, ref: 'EmailTemplate', required: true },
    interviewerEmailTemplate: { type: mongoose.Schema.Types.ObjectId, ref: 'EmailTemplate', required: true },
    feedbackFile: { type: String },
    feedbackDeadline: { type: Number, required: true },
    feedbackNotificationFrequency: { type: String, required: true },
    escalationEmail: { type: String },
    escalationDeadline: { type: Number, required: true },
    notes: { type: String },
    orderOfSchedule: [{ type: String, required: true }],
    interviewSchedulingMethod: { type: String, enum: ['flexible', 'fixed'], required: true },
    initialDateRange: {
        from: { type: Date },
        to: { type: Date }
    },
    proposedDates: [{ type: Date }],
    status: { type: String, enum: ['initialized', 'proposed', 'finalized', 'conducted', 'feedback_collected'], default: 'initialized' },
    calendarEventId: { type: String },
    scheduledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    resume: [{ type: String }]
}, { timestamps: true });

module.exports = mongoose.model('Interview', interviewSchema);
