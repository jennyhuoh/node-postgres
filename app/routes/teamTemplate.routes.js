module.exports = app => {
    const teamTemplate = require('../controllers/teamTemplate.controller');
    var router = require('express').Router();

    // Create a team template
    router.post('/teamTemplate', teamTemplate.createForUser);

    app.use(router);
}