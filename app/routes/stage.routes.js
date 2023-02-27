module.exports = app => {
    const stages = require('../controllers/stage.controller');

    var router = require('express').Router();

    // Create new stages in an Activity
    router.post('/activity/:activityId/stage', stages.create);

    app.use(router);
}