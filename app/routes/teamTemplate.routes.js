module.exports = app => {
    const teamTemplate = require('../controllers/teamTemplate.controller');
    var router = require('express').Router();

    // Create a team template
    router.post('/api/teamTemplate', teamTemplate.createForUser);
    // Get usable template
    router.get('/api/group/:groupId/:userId/activity/stage/teamTemplate', teamTemplate.getTemplates);
    // Give template's team and members
    router.post('/api/teamTemplate/:teamTemplateId', teamTemplate.giveTeamMembers);

    app.use(router);
}