module.exports = (sequelize, Sequelize) => {
    const UserProfile_Group = sequelize.define('userProfile_group', {
        isOwner: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
        }
    }, {timestamps: false})

    return UserProfile_Group;
}