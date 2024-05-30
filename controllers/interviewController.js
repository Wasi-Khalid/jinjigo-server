const { google } = require('googleapis');
const User = require('../models/User');
const Interview = require('../models/Interview');
const OAuth2Client = google.auth.OAuth2;

const refreshAccessToken = async (user) => {
    console.log('Attempting to refresh access token...');
    const oauth2Client = new OAuth2Client(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
    );
    oauth2Client.setCredentials({
        refresh_token: user.refreshToken
    });

    const { credentials } = await oauth2Client.refreshAccessToken();
    console.log('Access token refreshed:', credentials.access_token);
    user.accessToken = credentials.access_token;
    await user.save();

    return credentials.access_token;
};

const scheduleInterview = async (req, res) => {
    console.log('Scheduling interview...');
    if (!req.user) {
        console.log('Not authenticated');
        return res.status(401).send('Not authenticated');
    }

    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            console.log('User not found');
            return res.status(404).send('User not found');
        }

        if (user.role !== 'HR') {
            console.log('Permission denied');
            return res.status(403).send('Permission denied');
        }

        console.log('Creating interview document...');
        const { candidateEmail, interviewerEmails, startTime, endTime, summary, description, interviewType, interviewDuration, candidateEmailTemplate, interviewerEmailTemplate, feedbackFile, feedbackDeadline, escalationEmail, escalationDeadline } = req.body;

        const interview = new Interview({
            hr: user._id,
            candidateEmail,
            interviewerEmails,
            startTime,
            endTime,
            summary,
            description,
            interviewType,
            interviewDuration,
            candidateEmailTemplate,
            interviewerEmailTemplate,
            feedbackFile,
            feedbackDeadline,
            escalationEmail,
            escalationDeadline,
            scheduledBy: user._id
        });

        await interview.save();

        let accessToken = user.accessToken;
        const oauth2Client = new OAuth2Client(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI
        );
        oauth2Client.setCredentials({ access_token: accessToken });

        try {
            console.log('Inserting event into calendar...');
            const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
            const event = {
                summary,
                description,
                start: { dateTime: startTime },
                end: { dateTime: endTime },
                attendees: [
                    { email: user.email },
                    { email: candidateEmail },
                    ...interviewerEmails.map(email => ({ email }))
                ],
            };

            const response = await calendar.events.insert({
                calendarId: 'primary',
                resource: event,
                sendUpdates: 'all',
            });

            interview.calendarEventId = response.data.id;
            await interview.save();

            console.log('Interview scheduled successfully');
            res.status(201).send(interview);
        } catch (error) {
            console.log('Error inserting event into calendar:', error);
            if (error.response && error.response.status === 401) {
                if (!user.refreshToken) {
                    console.error('No refresh token is set.');
                    return res.status(500).send('No refresh token is set.');
                }
                accessToken = await refreshAccessToken(user);
                oauth2Client.setCredentials({ access_token: accessToken });

                const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
                const event = {
                    summary,
                    description,
                    start: { dateTime: startTime },
                    end: { dateTime: endTime },
                    attendees: [
                        { email: user.email },
                        { email: candidateEmail },
                        ...interviewerEmails.map(email => ({ email }))
                    ],
                };

                const response = await calendar.events.insert({
                    calendarId: 'primary',
                    resource: event,
                    sendUpdates: 'all',
                });

                interview.calendarEventId = response.data.id;
                await interview.save();

                console.log('Interview scheduled successfully after refreshing token');
                res.status(201).send(interview);
            } else {
                console.error('Error scheduling interview:', error);
                throw error;
            }
        }
    } catch (error) {
        console.error('Error scheduling interview:', error);
        res.status(500).send('Error scheduling interview');
    }
};

const getInterviewsByUser = async (req, res) => {
    const { userId } = req.params;

    try {
        const interviews = await Interview.find({ scheduledBy: userId }).populate('hr', 'username email');
        res.status(200).json({InterviewList: interviews});
    } catch (error) {
        console.error('Error fetching interviews:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const rescheduleInterview = async (req, res) => {
    const { interviewId } = req.params;
    const { startTime, endTime, summary, description } = req.body;

    try {
        const interview = await Interview.findById(interviewId);

        if (!interview) {
            return res.status(404).json({ error: 'Interview not found' });
        }

        interview.startTime = startTime || interview.startTime;
        interview.endTime = endTime || interview.endTime;
        interview.summary = summary || interview.summary;
        interview.description = description || interview.description;

        await interview.save();

        const user = await User.findById(interview.scheduledBy);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI
        );
        oauth2Client.setCredentials({ access_token: user.accessToken });

        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
        const event = {
            summary: interview.summary,
            description: interview.description,
            start: { dateTime: interview.startTime },
            end: { dateTime: interview.endTime },
        };

        await calendar.events.patch({
            calendarId: 'primary',
            eventId: interview.calendarEventId,
            resource: event,
            sendUpdates: 'all',
        });

        res.status(200).json(interview);
    } catch (error) {
        console.error('Error rescheduling interview:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const cancelInterview = async (req, res) => {
    const { interviewId } = req.params;

    try {
        const interview = await Interview.findById(interviewId);

        if (!interview) {
            return res.status(404).json({ error: 'Interview not found' });
        }

        const user = await User.findById(interview.scheduledBy);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI
        );
        oauth2Client.setCredentials({ access_token: user.accessToken });

        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

        await calendar.events.delete({
            calendarId: 'primary',
            eventId: interview.calendarEventId,
            sendUpdates: 'all',
        });

        await Interview.findByIdAndDelete(interviewId);

        res.status(200).json({ message: 'Interview canceled successfully' });
    } catch (error) {
        console.error('Error canceling interview:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = {
    scheduleInterview,
    getInterviewsByUser,
    rescheduleInterview,
    cancelInterview
};
