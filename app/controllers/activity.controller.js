const db = require('../models');
const Activity = db.activities;
const Stage = db.stages;
const Op = db.Sequelize.Op;

// Create and save an activity
exports.create = (req, res) => {
    function calculateExpiryDate(){
        const expiryDate = new Date(req.body.activityStartDate);
        expiryDate.setDate(expiryDate.getDate()+2);
        var year = expiryDate.toLocaleDateString("default", {year: "numeric"});
        var month = expiryDate.toLocaleDateString("default", {month: "2-digit"});
        var day = expiryDate.toLocaleDateString("default", {day: "2-digit"});
        var formatted = year+"-"+month+"-"+day
        return formatted;
    }
    const activity = {
        activityName: req.body.activityName,
        activityStartDate: req.body.activityStartDate,
        activityExpiryDate: calculateExpiryDate(),
        bigGroup_id: req.params.groupId
    }

    Activity.create(activity)
    .then(data => {
        res.send(data);
    })
    .catch(err => {
        res.status(500).send({
            message:
            err.message || "Some error occurred while creating the Activity."
        })
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