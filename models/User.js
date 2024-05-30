const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    googleId: { type: String },
    accessToken: { type: String },
    refreshToken: { type: String },
    role: { type: String, default: 'user' },
});

const User = mongoose.model('User', userSchema);

module.exports = User;
