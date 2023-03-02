module.exports = app => {
    const activities = require('../controllers/activity.controller');

    var router = require('express').Router();

    // Create a new activity
    router.post('/group/:groupId/activity', activities.create);
    // Get all activities in a group
    router.get('/group/:groupId/activities', activities.getAll);
    // Delete an activity
    router.delete('/activity/:activityId', activities.delete);

    app.use(router);
}