module.exports = (sequelize, Sequelize) => {
    const TeamTemplate = sequelize.define('teamTemplate', {
        teamTemplateName: {
            type: Sequelize.STRING
        },
    })

    return TeamTemplate;
}