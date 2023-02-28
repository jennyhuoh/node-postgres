module.exports = (sequelize, Sequelize) => {
    const Team = sequelize.define("team", {
        id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true
        },
        teamName: {
            type: Sequelize.STRING
        },
        teamMembers: {
            type: Sequelize.ARRAY(Sequelize.JSONB)
        },
        teamOrder: {
            type: Sequelize.INTEGER
        }
    })

    return Team;
}