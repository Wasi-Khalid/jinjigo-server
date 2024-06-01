const EmailTemplate = require('../models/EmailTemplate');

const createTemplate = async (req, res) => {
    const { name, title, content, type, placeholders } = req.body;

    try {
        const template = new EmailTemplate({ name, title, content, type, placeholders });
        await template.save();
        res.status(201).json(template);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const updateTemplate = async (req, res) => {
    const { templateId, name, title, content, type, placeholders } = req.body;

    try {
        const template = await EmailTemplate.findById(templateId);

        if (!template) {
            return res.status(404).json({ error: 'Template not found' });
        }

        template.name = name || template.name;
        template.title = title || template.title;
        template.content = content || template.content;
        template.type = type || template.type;
        template.placeholders = placeholders || template.placeholders;

        await template.save();

        res.status(200).json(template);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const deleteTemplate = async (req, res) => {
    const { templateId } = req.body;

    try {
        await EmailTemplate.findByIdAndDelete(templateId);
        res.status(200).json({ message: 'Template deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const getAllTemplates = async (req, res) => {
    try {
        const templates = await EmailTemplate.find();
        res.status(200).json(templates);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const getTemplateById = async (req, res) => {
    const { templateId } = req.body;

    try {
        const template = await EmailTemplate.findById(templateId);

        if (!template) {
            return res.status(404).json({ error: 'Template not found' });
        }

        res.status(200).json(template);
    } catch (error) {
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
