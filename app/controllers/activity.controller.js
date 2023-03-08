const db = require('../models');
const Activity = db.activities;
const Stage = db.stages;
const sequelize = db.sequelize;
const Op = db.Sequelize.Op;

function calculateExpiryDate(date){
    const expiryDate = new Date(date);
    expiryDate.setDate(expiryDate.getDate()+2);
    var year = expiryDate.toLocaleDateString("default", {year: "numeric"});
    var month = expiryDate.toLocaleDateString("default", {month: "2-digit"});
    var day = expiryDate.toLocaleDateString("default", {day: "2-digit"});
    var formatted = year+"-"+month+"-"+day
    return formatted;
}

// Create and save an activity
exports.create = (req, res) => { 
    const activity = {
        activityName: req.body.activityName,
        activityStartDate: req.body.activityStartDate,
        activityExpiryDate: calculateExpiryDate(req.body.activityStartDate),
        bigGroup_id: req.params.groupId
    }
    Activity.create(activity)
    .then(async data => {
        // make association between activity and stages
        try{
            sequelize.transaction(async (t) => {
                await Promise.all(
                    req.body.stageId.map(async (id) => {
                        await Stage.update({mainActivity_id: data.dataValues.id}, {where: {id: id}, transaction: t})
                    })
                );
                return res.send(data);
            })
        } catch(err) {
            console.log('err', err);
        }
    })
    .catch(err => {
        res.status(500).send({
            message:
            err.message || "Some error occurred while creating the Activity."
        })
    })
}

// Update an activity
exports.update = (req, res) => {
    const id = req.params.activityId;
    const newActivity = {
        activityName: req.body.activityName,
        activityStartDate: req.body.activityStartDate,
        activityExpiryDate: calculateExpiryDate(req.body.activityStartDate)
    }
    Activity.update(newActivity, {where: {id: id}})
    .then(() => {
        try{
            sequelize.transaction(async (t) => {
                await Promise.all(
                    req.body.stageId.map(async (stageId) => {
                        await Stage.update({mainActivity_id: id}, {where: {id: stageId}, transaction: t})
                    })
                );
            })
        } catch(err) {
            console.log('err', err);
        }
        res.send({message: 'successfully updated the activity!'})
    })
    .catch((err) => {
        console.log('Error occurred while updating the activity.', err)
    })
}

// Print an activity
exports.getOne = (req, res) => {
    const id = req.params.activityId;
    Activity.findByPk(id, {
        include: [
            {
                model: Stage,
                as: 'stagesForActivity',
                attributes: ['id', 'stageName', 'grouping', 'stageOrder'],
            },
        ],
    })
    .then(activity => {
        res.send(activity)
    })
    .catch((err) => {
        console.log('Error occurred while getting an activity.', err)
    })
}

// Print all activities in one group
exports.getAll = (req, res) => {
    Activity.findAll({where: {bigGroup_id: req.params.groupId}})
    .then(async (items) => {
        var recentArr = [];
        var historyArr = [];
        var result = [];
        await items.map(item => {
            const nowDate = new Date();
            const expiryDate = new Date(item.activityExpiryDate);
            if(expiryDate > nowDate){
                recentArr.push(item);
            } else {
                historyArr.push(item);
            }
        })
        recentArr = recentArr.sort(
            (a, b) => new Date(a.activityExpiryDate).getTime() - new Date(b.activityExpiryDate).getTime()
        )
        historyArr = historyArr.sort(
            (a, b) => new Date(b.activityExpiryDate).getTime() - new Date(a.activityExpiryDate).getTime()
        )
        result = recentArr.concat(historyArr)
        return res.send(result);
    })
    .catch((err) => {
        console.log('Some error occurred while getting activities.', err)
    })
}

// Delete an activity
exports.delete = (req, res) => {
    const id = req.params.activityId;
    Stage.destroy({where: {mainActivity_id: id}})
    Activity.destroy({where: {id: id}})
    .then(num => {
        if(num ===1) {
            res.send({message: 'successfully deleted!'})
        } else{
            res.send({message: 'failed to delete'})
        }
    })
    .catch(err => {
        res.status(500).send({
            message: 'failed to delete'
        })
    })
}