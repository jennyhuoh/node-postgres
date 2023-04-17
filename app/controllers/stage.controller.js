const db = require('../models');
const Stage = db.stages;
const Team = db.teams;
const sequelize = db.sequelize;
const Op = db.Sequelize.Op;

// Create a stage with no activity id
exports.createAStage = (req, res) => {
    // console.log(req.body);
    const stage = {
        stageName: req.body.stageName,
        grouping: req.body.grouping,
        stageChecked: false,
        stageOrder: req.body.stageOrder
    }
    Stage.create(stage)
    .then(data => {
        // console.log(data)
        res.send(data)
    })
    .catch(err => {
        res.status(500).send({
            message:
            err.message || 'Some error occurred while creating a stage.'
        })
    })
}

// Edit a stage
exports.editAStage = (req, res) => {
    const id = req.params.stageId;
    const stage = {
        stageName: req.body.stageName,
        grouping: req.body.grouping,
        stageChecked: req.body.stageChecked
    }
    Stage.update(stage, {where: {id: id}})
    .then(() => {
        Stage.findByPk(id)
        .then((data) => {
            res.send(data)
        })
    })
    .catch(err => {
        res.status(500).send({
            message:
            err.message || 'Some error occurred while editing a stage.'
        })
    })
}

// Delete a stage(not yet make sure there is a team template)
// if(team in a template)取消關聯即可 else destroy
exports.deleteAStage = (req, res) => {
    const id = req.params.stageId;
    Stage.findByPk(id, {
        include: [
            {
                model: Team,
                as: 'teams',
                attributes: ['id'],
                through: {
                    attributes: [],
                },
            },
        ],
    })
    .then(async (data) => {
        try{
            sequelize.transaction(async (t) => {
                await Promise.all(
                    data.dataValues.teams.map(async team => {
                        await Team.destroy({where: {id: team.id}, transaction: t})
                    })
                );
            })
        } catch(err) {
            console.log('err', err);
        }
    })
    .then(() => {
        Stage.destroy({where: {id: id}})
        .then(() => {
            res.send({message: 'successfully deleted!'})
        })
        .catch((err) => {
            res.status(500).send({
                message: 
                err.message || 'Some error occurred while deleting the stage.'
            })
        })
    })
}

// Update stages' sequence
exports.updateSequence = async (req, res) => {
    console.log('body', req.body)
    try{
        sequelize.transaction(async (t) => {
            await Promise.all(
                req.body.map(async (data) => {
                    const order = {stageOrder: data.order}
                    await Stage.update(order, {where: {id: data.id}, transaction: t})
                    .catch((err) => {
                        console.log("Error occurred while updating stages' sequence.", err)
                    })
                })
            );
            return res.send({message: 'success'})
        })
    } catch(err) {
        console.log('err', err)
    }
}
