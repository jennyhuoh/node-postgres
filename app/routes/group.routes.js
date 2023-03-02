module.exports = app => {
    const group = require('../controllers/group.controller');

    var router = require('express').Router();

    // Create a new group
    router.post('/group', group.create);
    // Update a group
    router.post('/group/:groupId', group.update);
    // Get all groups
    router.get('/groups', group.getAll);

    app.use(router);
}