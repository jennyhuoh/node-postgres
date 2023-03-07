const db = require('../models');
const Stage = db.stages;
const Op = db.Sequelize.Op;

// Create a stage with no activity id
exports.createAStage = (req, res) => {
    const stage = {
        stageName: req.body.stageName,
        grouping: req.body.grouping,
        stageChecked: false,
        stageOrder: req.body.stageOrder
    }
    Stage.create(stage)
    .then(data => {
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
        grouping: req.body.grouping
    }
    Stage.update(stage, {where: {id: id}})
    .then(() => {
        res.send({message: 'successfully edited!'})
    })
    .catch(err => {
        res.status(500).send({
            message:
            err.message || 'Some error occurred while edting a stage.'
        })
    })
}

// 
// exports.createAStage = async (req, res) => {
//     var stageArr = [];
//     await Promise.all(
//         req.body.data.map(async data => {
//             const stage = {
//                 stageName: data.stageName,
//                 grouping: data.grouping,
//                 stageChecked: false,
//                 stageOrder: data.stageOrder,
//                 mainActivity_id: req.params.activityId 
//             }
//             await Stage.create(stage)
//             .then(data => {
//                 console.log('successfully added a stage!')
//                 if(stage.grouping){
//                     stageArr.push(data.dataValues)
//                 }
//             })
//             .catch(err => {
//                 res.status(500).send({
//                     message:
//                     err.message || 'Some error occurred while creating the stage.'
//                 })
//             })
//         })
//     )
//     return res.send(stageArr)
// }