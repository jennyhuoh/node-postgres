const db = require('../models');
const Activity = db.activities;
const Stage = db.stages;
const sequelize = db.sequelize;
const Group = db.groups;
const Op = db.Sequelize.Op;

function calculateExpiryDate(date){
    const expiryDate = new Date(date);
    // console.log('date', expiryDate)
    expiryDate.setDate(expiryDate.getDate()+2);
    var year = expiryDate.toLocaleDateString("default", {year: "numeric"});
    var month = expiryDate.toLocaleDateString("default", {month: "2-digit"});
    var day = expiryDate.toLocaleDateString("default", {day: "2-digit"});
    var formatted = year+"-"+month+"-"+day
    // console.log('formatted', formatted)
    return formatted.toString();
}
function calculateStartDate(date) {
    const startDate = new Date(date);
    console.log('date', startDate)
    var year = startDate.toLocaleDateString("default", {year:"numeric"})
    var month = startDate.toLocaleDateString("default", {month: "2-digit"})
    var day = startDate.toLocaleDateString("default", {day: "2-digit"})
    var time = startDate.toLocaleTimeString("default", {hour: "2-digit", minute: "2-digit", hour12:true})
    var formatted = month+" 月 "+day+" 日 "+","+year+" 年 "+","+time
    console.log('formatted', formatted)
    return formatted.toString();
}

// Create and save an activity
exports.create = (req, res) => {
    console.log('body', req.body)
    var activity = {};
    Group.findOne({where: {groupMeetingId: req.params.groupId}})
    .then((group) => {
        activity = {
            activityName: req.body.activityName,
            activityStartDate: calculateStartDate(req.body.activityStartDate.toString()),
            activityExpiryDate: calculateExpiryDate(req.body.activityStartDate.toString()),
            bigGroup_id: group.dataValues.id
        }
    })
    .then(() => {
        Activity.create(activity)
        .then(async data => {
            // make association between activity and stages
            // console.log('data', data)
            try{
                sequelize.transaction(async (t) => {
                    await Promise.all(
                        req.body.stageId.map(async (id) => {
                            await Stage.update({mainActivity_id: data.dataValues.id}, {where: {id: id.id}, transaction: t})
                        })
                    );
                    res.send({message:'success'});
                })
            } catch(err) {
                console.log('err', err);
            }
            // res.send({message:'here'})
        })
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
    Group.findOne({where: {groupMeetingId: req.params.groupId}})
    .then((group) => {
        Activity.findAll({where: {bigGroup_id: group.dataValues.id}})
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