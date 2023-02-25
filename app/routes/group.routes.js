module.exports = app => {
    const group = require('../controllers/group.controller');

    var router = require('express').Router();

    // Create a new group
    router.post('/group', group.create);

    app.use(router);
}