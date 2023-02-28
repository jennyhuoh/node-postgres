const db = require("../models");

module.exports = (sequelize, Sequelize) => {
    const Stage_Team = sequelize.define('stage_team',
    {
        id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        stage_id: {
            type: Sequelize.INTEGER,
            // reference: {
            //     model: db.stages,
            //     key: 'id'
            // }
        },
        team_id: {
            type: Sequelize.INTEGER,
            // reference: {
            //     model: db.teams,
            //     key: 'id'
            // }
        }
    },
     {timestamps: false})

    return Stage_Team;
}