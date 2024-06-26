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
    startTime: { type: Date },
    endTime: { type: Date },
    candidateEmailTemplate: { type: mongoose.Schema.Types.ObjectId, ref: 'EmailTemplate', required: true },
    interviewerEmailTemplate: { type: mongoose.Schema.Types.ObjectId, ref: 'EmailTemplate', required: true },
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
    resume: [{ type: String }],
    feedback: [{
        interviewerEmail: { type: String, required: true },
        comments: { type: String, required: true },
        rating: { type: Number, required: true, min: 1, max: 5 }
    }]
}, { timestamps: true });

module.exports = mongoose.model('Interview', interviewSchema);