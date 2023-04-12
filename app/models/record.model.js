module.exports = (sequelize, Sequelize) => {
    const Record = sequelize.define("record", {
        recordContent: {
            type: Sequelize.BLOB
        },
        recordAuthor: {
            type: Sequelize.STRING
        }
    })

    return Record
}