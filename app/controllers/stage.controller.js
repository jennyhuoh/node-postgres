const db = require('../models');
const Stage = db.stages;
const Op = db.Sequelize.Op;

exports.create = async (req, res) => {
    var stageArr = [];
    await Promise.all(
        req.body.data.map(async data => {
            const stage = {
                stageName: data.stageName,
                grouping: data.grouping,
                stageChecked: false,
                stageOrder: data.stageOrder,
                mainActivity_id: req.params.activityId 
            }
            await Stage.create(stage)
            .then(data => {
                console.log('successfully added a stage!')

                if(stage.grouping){
                    stageArr.push(data.dataValues)
                }

            })
            .catch(err => {
                res.status(500).send({
                    message:
                    err.message || 'Some error occurred while creating the stage.'
                })
            })
        })
    )
    return res.send(stageArr)
    
}