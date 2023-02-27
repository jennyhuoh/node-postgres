module.exports = (sequelize, Sequelize) => {
    const Activity = sequelize.define('activity', {
        activityName: {
            type: Sequelize.STRING
        },
        activityStartDate: {
            type: Sequelize.STRING
        },
        activityExpiryDate: {
            type: Sequelize.STRING
        }
    })

    return Activity;
}