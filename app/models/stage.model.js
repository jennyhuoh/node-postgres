module.exports = (sequelize, Sequelize) => {
    const Stage = sequelize.define("stage", {
        stageName: {
            type: Sequelize.STRING
        },
        grouping: {  
            type: Sequelize.BOOLEAN
        },
        stageChecked: {
            type: Sequelize.BOOLEAN
        },
        stageOrder: {
            type: Sequelize.INTEGER
        }
    })

    return Stage;
}