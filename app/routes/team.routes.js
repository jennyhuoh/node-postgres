module.exports = app => {
    const teams = require('../controllers/team.controller');
    var router = require('express').Router();

    // Create new teams in a stage
    router.post('/stage/:stageId/teams', teams.create);
    // Get teams from a stage
    router.get('/stage/:stageId/teams', teams.getTeams);
    // Edit teams grom a stage
    router.post('/teams', teams.update);

    app.use(router);
}   
