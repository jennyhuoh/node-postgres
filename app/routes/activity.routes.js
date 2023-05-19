module.exports = app => {
    const activities = require('../controllers/activity.controller');

    var router = require('express').Router();

    // Create a new activity
    router.post('/api/group/:groupId/activity', activities.create);
    // Update an activity
    router.post('/api/activity/:activityId', activities.update);
    // Get an activity
    router.get('/api/activity/:activityId', activities.getOne);
    // Get all activities in a group
    router.get('/api/group/:groupId/activities', activities.getAll);
    // Delete an activity
    router.delete('/api/activity/:activityId', activities.delete);
    // Get single user's all activities
    router.get('/api/:userId/activities', activities.allActivities);

    app.use(router);
}