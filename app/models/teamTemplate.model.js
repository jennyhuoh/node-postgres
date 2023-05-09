module.exports = (sequelize, Sequelize) => {
    const TeamTemplate = sequelize.define('teamTemplate', {
        teamTemplateName: {
            type: Sequelize.STRING
        },
        templateMembers: {
            type: Sequelize.ARRAY(Sequelize.JSONB),
        },
    })

    return TeamTemplate;
}