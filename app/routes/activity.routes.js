module.exports = app => {
    const activities = require('../controllers/activity.controller');

    var router = require('express').Router();

    // Create a new activity
    router.post('/group/:groupId/activity', activities.create);
    // Update an activity
    router.post('/activity/:activityId', activities.update);
    // Get an activity
    router.get('/activity/:activityId', activities.getOne);
    // Get all activities in a group
    router.get('/group/:groupId/activities', activities.getAll);
    // Delete an activity
    router.delete('/activity/:activityId', activities.delete);
    // Get single user's all activities
    router.get('/:userId/activities', activities.allActivities);

    app.use(router);
}