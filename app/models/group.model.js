module.exports = (sequelize, Sequelize) => {
    const Group = sequelize.define("group", {
        groupMeetingId: {
            type: Sequelize.STRING
        },
        groupName: {
            type: Sequelize.STRING
        },
        groupExpiryDate: {
            type: Sequelize.STRING
        }
    })

    return Group;
}