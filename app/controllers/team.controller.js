const db = require('../models');
const Team = db.teams;
const Op = db.Sequelize.Op;
const { v4: uuidv4 } = require('uuid');

// Create and save new Teams for a stage
exports.create = (req, res) => {
    const team = {
        teamName: req.body.teamName,
        teamOrder: req.body.teamOrder
    }
}