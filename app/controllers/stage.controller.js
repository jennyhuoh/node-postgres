const db = require('../models');
const Stage = db.stages;
const Op = db.Sequelize.Op;

exports.create = (req, res) => {
    req.body.data.forEach((data) => {
        const stage = {
            stageName: data.stageName,
            grouping: data.grouping,
            stageChecked: false,
            stageOrder: data.stageOrder,
            mainActivity_id: req.params.activityId 
        }
        Stage.create(stage)
        .then(() => {
            console.log('successfully added a stage!')
            // res.send(data)
        })
        .catch(err => {
            res.status(500).send({
                message:
                err.message || 'Some error occurred while creating the stage.'
            })
        })

    })
    
}