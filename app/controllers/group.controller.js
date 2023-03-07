const db = require('../models');
const Group = db.groups;
const UserProfile_Group = db.userProfile_group;
const UserProfile = db.userProfiles;
const Activity = db.activities;
const Stage = db.stages;
const sequelize = db.sequelize;
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
exports.update = async (req, res) => {
    const id = req.params.groupId;
    const newGroup = {
        groupName: req.body.groupName,
        groupExpiryDate: req.body.groupExpiryDate
    }
    Group.update(newGroup, {where: {id: id}})

    const memberArr = [];
    await req.body.members.map((member) => {
        memberArr.push(member.id);
    })

    if(memberArr.length === req.body.members.length){
        try {
            sequelize.transaction(async (t) => {
                await Group.findByPk(id)
                .then(async (group) => {
                    await group.setUserProfiles(memberArr, {transaction: t})
                })
                .then(() => {
                    sequelize.transaction(async (t2) => {
                        await Promise.all(
                            req.body.members.map(async (member) => {
                                const owner = {isOwner: member.isOwner}
                                await UserProfile_Group.update(owner, {where: {userProfile_id: member.id, group_id:id}, transaction: t2})
                            })
                        );
                    })
                })
                .catch((err) => {
                    console.log('Error occurred while editing the group.', err)
                })
                return res.send({user:'success'})
            })
        } catch(err) {
            console.log('err', err)
        }
    }
}

// Print a Group
exports.getOne = (req, res) => {
    const id = req.params.groupId;
    Group.findByPk(id, {
        include: [
            {
                model: UserProfile,
                as: 'userProfiles',
                attributes: ['id', 'userName', 'userEmail'],
                through: {
                    attributes: [],
                },
            },
        ],
    })
    .then((data) => {
        res.send(data)
    })
    .catch((err) => {
        console.log('Error occurred while getting a group.', err);
    })
}

// Print all alive Group
exports.getAll = (req, res) => {
    Group.findAll({
        include: [
            {
                model: UserProfile,
                as: 'userProfiles',
                attributes: ['id', 'userName', 'userEmail'],
                through: {
                    attributes: [],
                },
            },
        ],
    })
    .then(async (data) => {
        var dataArr = [];
        await Promise.all(
            data.map(async (group) => {
                let activityNum = 0;
                await Activity.findAll({where: {bigGroup_id: group.id}})
                .then((activities) => {
                    console.log(activities.length)
                    activityNum = activities.length;
                })
                .then(() => {
                    group.dataValues.activityNum = activityNum
                })
                .then(() => {
                    console.log(group)
                    const nowDate = new Date();
                    const expiryDate = new Date(group.groupExpiryDate);
                    if(expiryDate > nowDate) {
                        dataArr.push(group);
                    }
                })
                
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
exports.delete = async (req, res) => {
    const id = req.params.groupId;
    await Activity.findAll({where: {bigGroup_id: id}})
    .then((activity) => {
        try{
            sequelize.transaction(async (t) => {
                await Promise.all(
                    activity.map(async (a) => {
                        Stage.destroy({where: {mainActivity_id: a.dataValues.id}, transaction: t})
                    })
                );
                await Activity.destroy({where: {bigGroup_id: id}})
            })
        }catch(err){
            console.log('err', err)
        }
    })
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