const { google } = require('googleapis');
const User = require('../models/User');
const Interview = require('../models/Interview');
const EmailTemplate = require('../models/EmailTemplate');
const OAuth2Client = google.auth.OAuth2;

const sendEmail = async (authClient, to, subject, body) => {
    const gmail = google.gmail({ version: 'v1', auth: authClient });
    const email = [
        `To: ${to}`,
        'Content-Type: text/html; charset=UTF-8',
        'MIME-Version: 1.0',
        `Subject: ${subject}`,
        '',
        body
    ].join('\n');

    const encodedMessage = Buffer.from(email).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
            raw: encodedMessage
        }
    });
};

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

const initializeInterview = async (req, res) => {
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
            candidateCurrentEmployer,
            candidateInformationUrl,
            interviewers,
            interviewType,
            interviewPosition,
            interviewDuration,
            candidateEmailTemplateId,
            interviewerEmailTemplateId,
            feedbackDeadline,
            feedbackNotificationFrequency,
            escalationEmail,
            escalationDeadline,
            notes,
            orderOfSchedule,
            interviewSchedulingMethod,
            initialDateRange,
            interviewStartTime,
            resume
        } = req.body;

        const candidateEmailTemplate = await EmailTemplate.findById(candidateEmailTemplateId);
        const interviewerEmailTemplate = await EmailTemplate.findById(interviewerEmailTemplateId);

        if (!candidateEmailTemplate || !interviewerEmailTemplate) {
            return res.status(404).json({ error: 'Email template not found' });
        }

        const interview = new Interview({
            hr: user._id,
            candidateName,
            candidateEmail,
            candidatePosition,
            candidateCurrentEmployer,
            candidateInformationUrl,
            interviewers,
            interviewType,
            interviewPosition,
            interviewDuration,
            startTime: interviewSchedulingMethod === 'fixed' ? new Date(interviewStartTime) : null,
            endTime: interviewSchedulingMethod === 'fixed' ? new Date(new Date(interviewStartTime).getTime() + interviewDuration * 60000) : null,
            candidateEmailTemplate: candidateEmailTemplate._id,
            interviewerEmailTemplate: interviewerEmailTemplate._id,
            feedbackDeadline,
            feedbackNotificationFrequency,
            escalationEmail,
            escalationDeadline,
            notes,
            orderOfSchedule: [...orderOfSchedule, candidateEmail],
            interviewSchedulingMethod,
            initialDateRange: interviewSchedulingMethod === 'flexible' ? { from: new Date(initialDateRange.from), to: new Date(initialDateRange.to) } : null,
            proposedDates: [],
            status: interviewSchedulingMethod === 'fixed' ? 'proposed' : 'initialized',
            scheduledBy: user._id,
            resume
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
            const emailSubject = candidateEmailTemplate.title;
            const emailBody = candidateEmailTemplate.content.replace('{candidateName}', candidateName).replace('{interviewType}', interviewType).replace('{interviewPosition}', interviewPosition);

            await sendEmail(oauth2Client, candidateEmail, emailSubject, emailBody);

            if (interviewSchedulingMethod === 'flexible') {
                const firstInterviewerEmail = interviewers[0];
                const firstInterviewerSubject = interviewerEmailTemplate.title;
                const firstInterviewerBody = interviewerEmailTemplate.content.replace('{interviewType}', interviewType).replace('{interviewPosition}', interviewPosition);

                await sendEmail(oauth2Client, firstInterviewerEmail, firstInterviewerSubject, firstInterviewerBody);
            } else {
                for (const email of interviewers) {
                    const interviewerEmailSubject = interviewerEmailTemplate.title;
                    const interviewerEmailBody = interviewerEmailTemplate.content.replace('{interviewerEmail}', email).replace('{interviewType}', interviewType).replace('{interviewPosition}', interviewPosition);

                    await sendEmail(oauth2Client, email, interviewerEmailSubject, interviewerEmailBody);
                }
            }

            res.status(201).send(interview);
        } catch (error) {
            if (error.response && error.response.status === 401) {
                if (!user.refreshToken) {
                    return res.status(500).send('No refresh token is set.');
                }
                accessToken = await refreshAccessToken(user);
                oauth2Client.setCredentials({ access_token: accessToken });

                const emailSubject = candidateEmailTemplate.title;
                const emailBody = candidateEmailTemplate.content.replace('{candidateName}', candidateName).replace('{interviewType}', interviewType).replace('{interviewPosition}', interviewPosition);

                await sendEmail(oauth2Client, candidateEmail, emailSubject, emailBody);

                if (interviewSchedulingMethod === 'flexible') {
                    const firstInterviewerEmail = interviewers[0];
                    const firstInterviewerSubject = interviewerEmailTemplate.title;
                    const firstInterviewerBody = interviewerEmailTemplate.content.replace('{interviewType}', interviewType).replace('{interviewPosition}', interviewPosition);

                    await sendEmail(oauth2Client, firstInterviewerEmail, firstInterviewerSubject, firstInterviewerBody);
                } else {
                    for (const email of interviewers) {
                        const interviewerEmailSubject = interviewerEmailTemplate.title;
                        const interviewerEmailBody = interviewerEmailTemplate.content.replace('{interviewerEmail}', email).replace('{interviewType}', interviewType).replace('{interviewPosition}', interviewPosition);

                        await sendEmail(oauth2Client, email, interviewerEmailSubject, interviewerEmailBody);
                    }
                }

                res.status(201).send(interview);
            } else {
                throw error;
            }
        }
    } catch (error) {
        console.error('Error initializing interview:', error);
        res.status(500).send('Error initializing interview');
    }
};

const proposeNewDates = async (req, res) => {
    const { interviewId, proposedDates } = req.body;

    try {
        const interview = await Interview.findById(interviewId);
        if (!interview) {
            return res.status(404).json({ error: 'Interview not found' });
        }

        const validProposedDates = proposedDates.filter(date => {
            const proposedDate = new Date(date);
            return proposedDate >= new Date(interview.initialDateRange.from) && proposedDate <= new Date(interview.initialDateRange.to);
        });

        if (validProposedDates.length === 0) {
            return res.status(400).json({ error: 'No valid proposed dates within the available range' });
        }

        interview.proposedDates.push(...validProposedDates);
        interview.status = 'proposed';
        await interview.save();

        const nextParticipantIndex = interview.proposedDates.length;
        if (nextParticipantIndex < interview.orderOfSchedule.length) {
            const nextParticipantEmail = interview.orderOfSchedule[nextParticipantIndex];
            const user = await User.findById(interview.scheduledBy);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            let accessToken = user.accessToken;
            const oauth2Client = new OAuth2Client(
                process.env.GOOGLE_CLIENT_ID,
                process.env.GOOGLE_CLIENT_SECRET,
                process.env.GOOGLE_REDIRECT_URI
            );
            oauth2Client.setCredentials({ access_token: accessToken });

            const emailTemplate = await EmailTemplate.findById(interview.interviewerEmailTemplate);
            const emailSubject = emailTemplate.title;
            const emailBody = emailTemplate.content.replace('{interviewType}', interview.interviewType).replace('{interviewPosition}', interview.interviewPosition);

            await sendEmail(oauth2Client, nextParticipantEmail, emailSubject, emailBody);
        } else {
            interview.status = 'finalized';
            await interview.save();

            const user = await User.findById(interview.scheduledBy);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            let accessToken = user.accessToken;
            const oauth2Client = new OAuth2Client(
                process.env.GOOGLE_CLIENT_ID,
                process.env.GOOGLE_CLIENT_SECRET,
                process.env.GOOGLE_REDIRECT_URI
            );
            oauth2Client.setCredentials({ access_token: accessToken });

            const emailTemplate = await EmailTemplate.findById(interview.interviewerEmailTemplate);
            const emailSubject = emailTemplate.title;
            const emailBody = emailTemplate.content.replace('{interviewType}', interview.interviewType).replace('{interviewPosition}', interview.interviewPosition);

            for (const email of interview.interviewers) {
                await sendEmail(oauth2Client, email, emailSubject, emailBody);
            }

            const candidateEmailTemplate = await EmailTemplate.findById(interview.candidateEmailTemplate);
            const candidateEmailSubject = candidateEmailTemplate.title;
            const candidateEmailBody = candidateEmailTemplate.content.replace('{candidateName}', interview.candidateName).replace('{interviewType}', interview.interviewType).replace('{interviewPosition}', interview.interviewPosition);

            await sendEmail(oauth2Client, interview.candidateEmail, candidateEmailSubject, candidateEmailBody);
        }

        res.status(200).json({ message: 'Proposed dates added', interview });
    } catch (error) {
        console.error('Error proposing new dates:', error);
        res.status(500).send('Error proposing new dates');
    }
};

const confirmFinalDate = async (req, res) => {
    const { interviewId, finalizedDate } = req.body;

    try {
        const interview = await Interview.findById(interviewId);
        if (!interview) {
            return res.status(404).json({ error: 'Interview not found' });
        }

        interview.startTime = new Date(finalizedDate);
        interview.endTime = new Date(new Date(finalizedDate).getTime() + interview.interviewDuration * 60000);
        interview.status = 'finalized';
        await interview.save();

        const user = await User.findById(interview.scheduledBy);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        let accessToken = user.accessToken;
        const oauth2Client = new OAuth2Client(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI
        );
        oauth2Client.setCredentials({ access_token: accessToken });

        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
        const event = {
            summary: interview.interviewType,
            description: `Interview for the position of ${interview.interviewPosition}`,
            start: { dateTime: interview.startTime },
            end: { dateTime: interview.endTime },
            attendees: [
                { email: user.email },
                { email: interview.candidateEmail },
                ...interview.interviewers.map(email => ({ email }))
            ],
        };

        await calendar.events.insert({
            calendarId: 'primary',
            resource: event,
            sendUpdates: 'all',
        });

        res.status(200).json(interview);
    } catch (error) {
        console.error('Error confirming final date:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const rescheduleInterview = async (req, res) => {
    const { interviewId, startTime, endTime } = req.body;

    try {
        const interview = await Interview.findById(interviewId);

        if (!interview) {
            return res.status(404).json({ error: 'Interview not found' });
        }

        interview.startTime = startTime || interview.startTime;
        interview.endTime = endTime || interview.endTime;

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
            summary: interview.interviewType,
            description: `Interview for the position of ${interview.interviewPosition}`,
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
    const { interviewId, interviewerEmail, comments, rating } = req.body;

    try {
        const interview = await Interview.findById(interviewId);

        if (!interview) {
            return res.status(404).json({ error: 'Interview not found' });
        }

        interview.feedback.push({ interviewerEmail, comments, rating });
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

const getAllInterviews = async (req, res) => {
    try {
        const interviews = await Interview.find({}).populate('hr', 'username email');
        res.status(200).json(interviews);
    } catch (error) {
        console.error('Error fetching interviews:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = {
    scheduleInterview: initializeInterview,
    proposeNewDates,
    confirmFinalDate,
    rescheduleInterview,
    cancelInterview,
    getInterviewsByUser,
    getSingleInterviewById,
    getInterviewStatus,
    updateCandidateResponse,
    collectFeedback,
    nextActionDecision,
    getAllInterviews
};
