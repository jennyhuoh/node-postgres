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

module.exports = db;

