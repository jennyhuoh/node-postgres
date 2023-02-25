module.exports = app => {
    const userProfiles = require('../controllers/userProfile.controller');

    var router = require('express').Router();

    // Create a new User
    router.post('/user', userProfiles.create);

    // Get all users
    router.get('/users', userProfiles.getAll)

    app.use(router)
}