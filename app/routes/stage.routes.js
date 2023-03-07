module.exports = app => {
    const stages = require('../controllers/stage.controller');

    var router = require('express').Router();

    // Create new stages in an Activity
    router.post('/stage', stages.createAStage);

    app.use(router);
}