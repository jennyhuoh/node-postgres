module.exports = app => {
    const stages = require('../controllers/stage.controller');

    var router = require('express').Router();

    // Create a stage
    router.post('/api/stage', stages.createAStage);
    // Edit a stage
    router.post('/api/stage/:stageId', stages.editAStage);
    // Update stages' sequence
    router.post('/api/stages', stages.updateSequence);
    // Delete a stage
    router.delete('/api/stage/:stageId', stages.deleteAStage)

    app.use(router);
}