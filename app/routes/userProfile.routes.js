module.exports = app => {
    const userProfiles = require('../controllers/userProfile.controller');

    var router = require('express').Router();

    // Create a new User
    router.post('/api/register', userProfiles.create);

    // Get all users
    router.get('/api/users', userProfiles.getAll)

    // User Login
    router.post('/api/login', userProfiles.login);

    app.use(router)
}