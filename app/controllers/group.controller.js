const db = require('../models');
const Group = db.groups;
const UserProfile_Group = db.userProfile_group;
const Op = db.Sequelize.Op;
const { v4: uuidv4 } = require('uuid');

// Create and save new Group
exports.create = (req, res) => {
    // Validate request
    if(!req.body.groupName){
        res.status(400).send({
            message: 'Content can not be empty!'
        });
        return;
    }
    const group = {
        groupMeetingId: `${uuidv4()}`,
        groupName: req.body.groupName,
        groupExpiryDate: req.body.groupExpiryDate
    }

    Group.create(group)
    .then(data => {
        console.log('successfully create a group!')
        res.send(data)
        console.log(data.id)
        console.log(data.dataValues)
        // 建立group的member&host
        req.body.members.forEach((member) => {
            const userProfile_group = {
                isOwner: member.isOwner,
                group_id: data.id,
                userProfile_id: member.id
            }
            UserProfile_Group.create(userProfile_group)
            .then(() => {
                console.log('UserProfile Group created.')
            })
            .catch(err => {
                res.status(500).send({
                    message:
                    err.message || 'Some error.'
                })
            })
        })
    })
    .catch(err => {
        res.status(500).send({
            message:
            err.message || "Some error occurred while creating the group."
        })
    })

}
