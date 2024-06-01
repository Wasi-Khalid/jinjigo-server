const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    googleId: { type: String },
    msId: { type: String },
    accessToken: { type: String },
    refreshToken: { type: String },
    role: { type: String, enum: ['HR', 'CANDIDATE', 'INTERVIEWER', 'HIRING_MANAGER'], default: 'CANDIDATE' },
    linkedCalendars: { type: [String], default: [] }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
