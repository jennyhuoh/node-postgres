const db = require('../models');
const Team = db.teams;
const Stage = db.stages;
const sequelize = db.sequelize;
const Op = db.Sequelize.Op;

// Create and save new Teams for a stage
exports.create = async (req, res) => {
    const stageId = req.params.stageId;
    // try{
    //     sequelize.transaction(async (t) => {
            // console.log('body', req.body)
            const teamIdArr = [];
            await Promise.all(
                req.body.map(async ele => {
                    const team = {
                        teamName: ele.teamName,
                        teamOrder: ele.teamOrder,
                        teamMembers: ele.teamMembers,
                    }
                    await Team.create(team)
                    .then(async (data) => {
                        teamIdArr.push(data.dataValues.id);
                        console.log('successfully created a team!')
                        // console.log('dataId', data.dataValues.id)
                        await this.addToStage(data.dataValues.id, stageId);
                    })
                    .catch(err => {
                        res.status(500).send({
                            message:
                            err.message || "Some error occurred while creating the team."
                        })
                    })
                })
            )
            res.send(teamIdArr);
    //     })
    // } catch(err) {
    //     console.log('err', err)
    // }
}

exports.addToStage = (teamId, stageId) => {
    return Team.findOne({where: {id: teamId}})
    .then((team) => {
        if(!team){
            console.log('Team not found');
            return null;
        }
        return Stage.findByPk(stageId)
            .then((stage) => {
                if(!stage) {
                    console.log('Stage not found')
                    return null;
                }
                team.addStage(stage);
                return team;
            })
    })
    .catch((err) => {
        console.log('Error occurred while adding team to stage: ', err)
    })
}

// Print teams from a stage
exports.getTeams = (req, res) => {
    const stageId = req.params.stageId;
    Stage.findByPk(stageId, {
        include: [
            {
                model: Team,
                as: 'teams',
                attributes: ['id', 'teamName', 'teamOrder', 'teamMembers'],
                through: {
                    attributes: [],
                },
            },
        ],
    })
    .then((data) => {
        let newTeams = data.dataValues.teams;
        newTeams = newTeams.sort(
            (a, b) => a.teamOrder - b.teamOrder
        )
        data.dataValues.teams = newTeams;
        // console.log(data)
        res.send(data)
    })
    .catch((err) => {
        console.log('Error occurred while getting teams from a stage.', err);
    })
}

// Edit teams from a stage
exports.update = (req, res) => {
    try{
        sequelize.transaction(async (t) => {
            await Promise.all(
                req.body.data.map(async ele => {
                    const team = {
                        teamName: ele.teamName,
                        teamOrder: ele.teamOrder,
                        teamMembers: ele.teamMembers,
                    }
                    await Team.update(team, {where: {id: ele.id}, transaction: t})
                    .catch(err => {
                        res.status(500).send({
                            message:
                            err.message || "Some error occurred while editing the team."
                        })
                    })
                })
            )
            return res.send({user:'success'})
        })
    } catch(err) {
        console.log('err', err)
    } 
}