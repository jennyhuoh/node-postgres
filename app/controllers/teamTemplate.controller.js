const db = require('../models');
const TeamTemplate = db.teamTemplates;
const Op = db.Sequelize.Op;

// Create and save an teamTemplate for a user
exports.createForUser = (req, res) => {
    const teamTemplate = {
        teamTemplateName: req.body.teamTemplateName,
        userTemplate_id: req.params.userTemplateId,
        
    }
}