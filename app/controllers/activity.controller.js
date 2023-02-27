const db = require('../models');
const Activity = db.activities;
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