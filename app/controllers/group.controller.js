const db = require('../models');
const Group = db.groups;
const UserProfile_Group = db.userProfile_group;
const UserProfile = db.userProfiles;
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

// Update Group content
exports.update = (req, res) => {
    const id = req.params.groupId;
    // Group.findOne({where: {id: id}})
    const newGroup = {
        groupName: req.body.groupName,
        groupExpiryDate: req.body.groupExpiryDate
    }
    Group.update(newGroup, {where: {id: id}})
    Group.findByPk(id)
    .then((group) => {
        req.body.members.forEach((member) => {
            group.setUserProfiles(member.id, { through: {isOwner: member.isOwner}})
        })
    })
    .catch((err) => {
        console.log('Error occurred while editing the group.', err)
    })
    res.send({user:'success'})
}

// Print all alive Group
exports.getAll = (req, res) => {
    Group.findAll({
        include: [
            {
                model: UserProfile,
                as: 'userProfiles',
                attributes: ['id', 'userName'],
                through: {
                    attributes: [],
                },
            },
        ],
    })
    .then(async (data) => {
        var dataArr = [];
        await Promise.all(
            data.map((group) => {
                const nowDate = new Date();
                const expiryDate = new Date(group.groupExpiryDate);
                console.log(expiryDate < nowDate)
                if(expiryDate > nowDate) {
                    dataArr.push(group);
                }
            })
        );
        return res.send(dataArr);
    })
    .catch((err) => {
        console.log('Error while retrieving Groups: ', err);
    })
}

// Print all history Group
exports.getAllHistory = (req, res) => {
    Group.findAll({
        include: [
            {
                model: UserProfile,
                as: 'userProfiles',
                attributes: ['id', 'userName'],
                through: {
                    attributes: [],
                },
            },
        ],
    })
    .then(async (data) => {
        var dataArr = [];
        await Promise.all(
            data.map((group) => {
                const nowDate = new Date();
                const expiryDate = new Date(group.groupExpiryDate);
                console.log(expiryDate < nowDate)
                if(expiryDate < nowDate) {
                    dataArr.push(group);
                }
            })
        );
        return res.send(dataArr);
    })
    .catch((err) => {
        console.log('Error while retrieving Groups: ', err);
    })
}

// Delete a Group
exports.delete = (req, res) => {
    const id = req.params.groupId;

    Group.destroy({where: {id: id}})
    .then(num => {
        if(num === 1) {
            res.send({message: 'succesfully deleted!'})
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