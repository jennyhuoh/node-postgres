module.exports = app => {
    const teams = require('../controllers/team.controller');
    var router = require('express').Router();

    // Create new teams in a stage
    router.post('/stage/:stageId/teams', teams.create);
    // Get teams for a stage
    router.get('/stage/:stageId/teams', teams.getTeams);

    app.use(router);
}   
