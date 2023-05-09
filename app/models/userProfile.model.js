module.exports = (sequelize, Sequelize) => {
    const UserProfile = sequelize.define("userProfile", {
        userName: {
            type: Sequelize.STRING
        },
        userEmail: {
            type: Sequelize.STRING
        },
        userRole: {
            type: Sequelize.STRING
        },
        userPassword: {
            type: Sequelize.STRING
        }
    })

    return UserProfile;
}