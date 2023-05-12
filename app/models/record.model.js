module.exports = (sequelize, Sequelize) => {
    const Record = sequelize.define("record", {
        recordContent: {
            type: Sequelize.STRING
        },
        recordAuthor: {
            type: Sequelize.STRING
        },
        recordAuthorId: {
            type: Sequelize.INTEGER
        },
        recordTargetId: {
            type: Sequelize.INTEGER
        },
        recordTargetName: {
            type: Sequelize.STRING
        }
    })

    return Record
}