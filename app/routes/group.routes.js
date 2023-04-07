module.exports = app => {
    const group = require('../controllers/group.controller');

    var router = require('express').Router();

    // Create a new group
    router.post('/group', group.create);
    // Update a group
    router.post('/group/:groupId', group.update);
    // Get a group
    router.get('/group/:groupId', group.getOne);
    // Get all groups
    router.get('/groups/:userId', group.getAll);
    // Get all history groups
    router.get('/history/groups', group.getAllHistory);
    // Delete a group
    router.delete('/group/:groupId', group.delete);

    app.use(router);
}