module.exports = app => {
    const group = require('../controllers/group.controller');

    var router = require('express').Router();

    // Create a new group
    router.post('/api/group', group.create);
    // Update a group
    router.post('/api/group/:groupId', group.update);
    // Get a group
    router.get('/api/group/:groupId', group.getOne);
    // Get all groups
    router.get('/api/groups/:userId', group.getAll);
    // Get all history groups
    router.get('/api/history/groups', group.getAllHistory);
    // Delete a group
    router.delete('/api/group/:groupId', group.delete);

    app.use(router);
}