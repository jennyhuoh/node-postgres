module.exports = (sequelize, Sequelize) => {
    const Record = sequelize.define("record", {
        recordContent: {
            type: Sequelize.STRING
        },
        recordAuthor: {
            type: Sequelize.STRING
        }
    })

    return Record
}