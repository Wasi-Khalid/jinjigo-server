const { google } = require('googleapis');
const User = require('../models/User');

const listEvents = async (req, res) => {
    if (!req.user) {
        return res.status(401).send('Not authenticated');
    }

    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).send('User not found');
        }

        const oauth2Client = new google.auth.OAuth2();
        oauth2Client.setCredentials({ access_token: user.accessToken });

        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
        const response = await calendar.events.list({
            calendarId: 'primary',
            timeMin: (new Date()).toISOString(),
            maxResults: 10,
            singleEvents: true,
            orderBy: 'startTime',
        });
        res.send(response.data.items);
    } catch (error) {
        res.status(500).send('Error retrieving events');
    }
};

const createEvent = async (req, res) => {
    if (!req.user) {
        return res.status(401).send('Not authenticated');
    }

    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).send('User not found');
        }

        const { summary, description, startTime, endTime } = req.body;

        const oauth2Client = new google.auth.OAuth2();
        oauth2Client.setCredentials({ access_token: user.accessToken });

        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
        const event = {
            summary,
            description,
            start: { dateTime: startTime },
            end: { dateTime: endTime },
        };

        const response = await calendar.events.insert({
            calendarId: 'primary',
            resource: event,
        });
        res.send(response.data);
    } catch (error) {
        res.status(500).send('Error creating event');
    }
};

module.exports = {
    listEvents,
    createEvent,
};
