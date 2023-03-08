module.exports = app => {
    const stages = require('../controllers/stage.controller');

    var router = require('express').Router();

    // Create a stage
    router.post('/stage', stages.createAStage);
    // Edit a stage
    router.post('/stage/:stageId', stages.editAStage);
    // Updata stages' sequence
    router.post('/stages', stages.updateSequence);
    // Delete a stage
    router.delete('/stage/:stageId', stages.deleteAStage)

    app.use(router);
}