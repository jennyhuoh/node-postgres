module.exports = app => {
    const userProfiles = require('../controllers/userProfile.controller');

    var router = require('express').Router();

    // Create a new User
    router.post('/register', userProfiles.create);

    // Get all users
    router.get('/users', userProfiles.getAll)

    // User Login
    router.post('/login', userProfiles.login);

    app.use(router)
}