const EmailTemplate = require('../models/EmailTemplate');

const createTemplate = async (req, res) => {
    try {
        const { name, title, content, type, placeholders } = req.body;
        const emailTemplate = new EmailTemplate({ name, title, content, type, placeholders });
        await emailTemplate.save();
        res.status(201).json(emailTemplate);
    } catch (error) {
        console.error('Error creating email template:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const updateTemplate = async (req, res) => {
    const { templateId, name, title, content, type, placeholders } = req.body;

    try {
        const emailTemplate = await EmailTemplate.findById(templateId);
        if (!emailTemplate) {
            return res.status(404).json({ error: 'Template not found' });
        }

        emailTemplate.name = name || emailTemplate.name;
        emailTemplate.title = title || emailTemplate.title;
        emailTemplate.content = content || emailTemplate.content;
        emailTemplate.type = type || emailTemplate.type;
        emailTemplate.placeholders = placeholders || emailTemplate.placeholders;

        await emailTemplate.save();
        res.status(200).json(emailTemplate);
    } catch (error) {
        console.error('Error updating email template:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const deleteTemplate = async (req, res) => {
    const { templateId } = req.body;

    try {
        const emailTemplate = await EmailTemplate.findByIdAndDelete(templateId);
        if (!emailTemplate) {
            return res.status(404).json({ error: 'Template not found' });
        }

        res.status(200).json({ message: 'Template deleted successfully' });
    } catch (error) {
        console.error('Error deleting email template:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const getAllTemplates = async (req, res) => {
    try {
        const emailTemplates = await EmailTemplate.find({});
        res.status(200).json(emailTemplates);
    } catch (error) {
        console.error('Error fetching email templates:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const getTemplateById = async (req, res) => {
    const { templateId } = req.body;

    try {
        const emailTemplate = await EmailTemplate.findById(templateId);
        if (!emailTemplate) {
            return res.status(404).json({ error: 'Template not found' });
        }

        res.status(200).json(emailTemplate);
    } catch (error) {
        console.error('Error fetching email template:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = {
    createTemplate,
    updateTemplate,
    deleteTemplate,
    getAllTemplates,
    getTemplateById
};
