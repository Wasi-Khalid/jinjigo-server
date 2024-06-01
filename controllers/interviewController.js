const { google } = require('googleapis');
const User = require('../models/User');
const Interview = require('../models/Interview');
const OAuth2Client = google.auth.OAuth2;

const refreshAccessToken = async (user) => {
    const oauth2Client = new OAuth2Client(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
    );
    oauth2Client.setCredentials({
        refresh_token: user.refreshToken
    });

    const { credentials } = await oauth2Client.refreshAccessToken();
    user.accessToken = credentials.access_token;
    await user.save();

    return credentials.access_token;
};

const scheduleInterview = async (req, res) => {
    if (!req.user) {
        return res.status(401).send('Not authenticated');
    }

    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).send('User not found');
        }

        if (user.role !== 'HR') {
            return res.status(403).send('Permission denied');
        }

        const {
            candidateName,
            candidateEmail,
            candidatePosition,
            currentEmployer,
            intervieweeInfoURL,
            interviewerEmails,
            interviewType,
            interviewPosition,
            interviewDuration,
            startTime,
            endTime,
            summary,
            description,
            candidateEmailTemplate,
            interviewerEmailTemplate,
            feedbackFile,
            feedbackDeadline,
            escalationEmail,
            escalationDeadline,
            notes
        } = req.body;

        const interview = new Interview({
            hr: user._id,
            candidateName,
            candidateEmail,
            candidatePosition,
            currentEmployer,
            intervieweeInfoURL,
            interviewerEmails,
            interviewType,
            interviewPosition,
            interviewDuration,
            startTime,
            endTime,
            summary,
            description,
            candidateEmailTemplate,
            interviewerEmailTemplate,
            feedbackFile,
            feedbackDeadline,
            escalationEmail,
            escalationDeadline,
            scheduledBy: user._id,
            notes
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

            res.status(201).send(interview);
        } catch (error) {
            if (error.response && error.response.status === 401) {
                if (!user.refreshToken) {
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

                res.status(201).send(interview);
            } else {
                throw error;
            }
        }
    } catch (error) {
        res.status(500).send('Error scheduling interview');
    }
};

const rescheduleInterview = async (req, res) => {
    const { interviewId, startTime, endTime, summary, description } = req.body;

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
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const cancelInterview = async (req, res) => {
    const { interviewId } = req.body;

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
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const getInterviewsByUser = async (req, res) => {
    const { userId } = req.body;

    try {
        const interviews = await Interview.find({ scheduledBy: userId }).populate('hr', 'username email');
        res.status(200).json(interviews);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const getSingleInterviewById = async (req, res) => {
    const { interviewId } = req.body;

    try {
        const interview = await Interview.findById(interviewId).populate('hr', 'username email');
        if (!interview) {
            return res.status(404).json({ error: 'Interview not found' });
        }
        res.status(200).json(interview);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const getInterviewStatus = async (req, res) => {
    const { interviewId } = req.body;

    try {
        const interview = await Interview.findById(interviewId);

        if (!interview) {
            return res.status(404).json({ error: 'Interview not found' });
        }

        res.status(200).json({ candidateStatus: interview.candidateStatus });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const updateCandidateResponse = async (req, res) => {
    const { interviewId, candidateStatus } = req.body;

    try {
        const interview = await Interview.findById(interviewId);

        if (!interview) {
            return res.status(404).json({ error: 'Interview not found' });
        }

        interview.candidateStatus = candidateStatus;
        await interview.save();

        res.status(200).json(interview);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const collectFeedback = async (req, res) => {
    const { interviewId, feedback } = req.body;

    try {
        const interview = await Interview.findById(interviewId);

        if (!interview) {
            return res.status(404).json({ error: 'Interview not found' });
        }

        interview.feedback.push(feedback);
        await interview.save();

        res.status(200).json(interview);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const nextActionDecision = async (req, res) => {
    const { interviewId, nextAction } = req.body;

    try {
        const interview = await Interview.findById(interviewId);

        if (!interview) {
            return res.status(404).json({ error: 'Interview not found' });
        }

        interview.nextAction = nextAction;
        await interview.save();

        res.status(200).json(interview);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = {
    scheduleInterview,
    rescheduleInterview,
    cancelInterview,
    getInterviewsByUser,
    getSingleInterviewById,
    getInterviewStatus,
    updateCandidateResponse,
    collectFeedback,
    nextActionDecision
};