const dbConfig = require("../config/db.config.js")

const Sequelize = require('sequelize');
const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
    host: dbConfig.HOST,
    dialect: dbConfig.dialect,
    operatorAliases: false,
    pool: {
        max: dbConfig.pool.max,
        min: dbConfig.pool.min,
        acquire: dbConfig.pool.acquire,
        idle: dbConfig.pool.idle
    }
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;
db.userProfiles = require('./userProfile.model')(sequelize, Sequelize);
db.groups = require('./group.model')(sequelize, Sequelize);
db.userProfile_group = require('./userProfile_group.model')(sequelize, Sequelize);
db.activities = require('./activity.model')(sequelize, Sequelize);
db.stages = require('./stage.model')(sequelize, Sequelize);
db.teams = require('./team.model')(sequelize, Sequelize);
db.teamTemplates = require('./teamTemplate.model')(sequelize, Sequelize);

// group有許多member，user有許多group
db.groups.belongsToMany(db.userProfiles, {
    through: db.userProfile_group,
    as: "userProfiles",
    foreignKey: "group_id",
})
db.userProfiles.belongsToMany(db.groups, {
    through: db.userProfile_group,
    as: "groups",
    foreignKey: "userProfile_id",
})

// 一個group有許多activities，一個activity只屬於一個group
db.groups.hasMany(db.activities, { 
    foreignKey: 'bigGroup_id',
    as: 'activitiesForGroup' 
});
db.activities.belongsTo(db.groups, { 
    as: 'groupsForActivities',
    foreignKey: 'bigGroup_id',
})

// 一個activity有許多stages，一個stage只屬於一個activity
db.activities.hasMany(db.stages, {
    foreignKey: 'mainActivity_id',
    as: 'stagesForActivity',
})
db.stages.belongsTo(db.activities, {
    foreignKey: 'mainActivity_id',
    as: 'activitiesForStages'
})

// 一個stage可以有多個teams，一個team可以屬於許多stages
db.stages.belongsToMany(db.teams, {
    through: 'stage_team',
    as: 'teams',
    foreignKey: 'team_id'
})
db.teams.belongsToMany(db.stages, {
    through: 'stage_team',
    as: 'stages',
    foreignKey: 'stage_id'
})

// 一個user有多個teamTemplate，一個teamTemplate只屬於一個user
db.userProfiles.hasMany(db.teamTemplates, {
    foreignKey: 'userTemplate_id',
    as: 'teamTemplatesForUser',
})
db.teamTemplates.belongsTo(db.userProfiles, {
    foreignKey: 'userTemplate_id',
    as: 'usersForTeamplates'
})

module.exports = db;

