module.exports = app => {
    const activities = require('../controllers/activity.controller');

    var router = require('express').Router();

    // Create a new activity
    router.post('/group/:groupId/activity', activities.create);

    app.use(router);
}