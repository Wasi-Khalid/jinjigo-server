const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
    hr: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    candidateName: { type: String, required: true, maxlength: 100 },
    candidateEmail: { type: String, required: true },
    candidatePosition: { type: String, required: true, maxlength: 100 },
    currentEmployer: { type: String, maxlength: 100 },
    intervieweeInfoURL: { type: String },
    interviewerEmails: [{ type: String, required: true }],
    interviewType: { type: String, required: true },
    interviewPosition: { type: String, required: true, maxlength: 100 },
    interviewDuration: { type: Number, required: true, max: 420 },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    summary: { type: String, required: true, maxlength: 100 },
    description: { type: String, required: true, maxlength: 1000 },
    candidateEmailTemplate: { type: String, required: true },
    interviewerEmailTemplate: { type: String, required: true },
    feedbackFile: { type: String },
    feedbackDeadline: { type: Number, required: true },
    escalationEmail: { type: String, required: true },
    escalationDeadline: { type: Number, required: true },
    calendarEventId: { type: String },
    scheduledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    feedback: [{ type: String }],
    nextAction: { type: String },
    candidateStatus: { type: String, enum: ['Pending', 'Accepted', 'Rejected'], default: 'Pending' },
    notes: { type: String, maxlength: 1000 }
}, { timestamps: true });

module.exports = mongoose.model('Interview', interviewSchema);
