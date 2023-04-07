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
    console.log('req', req.body);
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
        console.log('successfully created a group!')
        try{
            sequelize.transaction(async (t) => {
                await Promise.all(
                    // 建立group的member&host
                    req.body.members.map(async member => {
                        const userProfile_group = {
                            isOwner: member.isOwner,
                            group_id: data.id,
                            userProfile_id: member.id
                        }
                        await UserProfile_Group.create(userProfile_group, {transaction: t})
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
                )
                res.send({message:'success'})
            })
        } catch(err) {
            console.log('err', err)
        }
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
    Group.update(newGroup, {where: {groupMeetingId: id}})

    const memberArr = [];
    await req.body.members.map((member) => {
        memberArr.push(member.id);
    })
    var groupID;
    if(memberArr.length === req.body.members.length){
        try {
            sequelize.transaction(async (t) => {
                await Group.findOne({where: {groupMeetingId: id}})
                .then(async (group) => {
                    await group.setUserProfiles(memberArr, {transaction: t})
                    groupID = await group.dataValues.id;
                })
                .then(() => {
                    sequelize.transaction(async (t2) => {
                        await Promise.all(
                            req.body.members.map(async (member) => {
                                const owner = {isOwner: member.isOwner}
                                await UserProfile_Group.update(owner, {where: {userProfile_id: member.id, group_id: groupID}, transaction: t2})
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
    Group.findOne({
        where: {groupMeetingId: id},
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
        var newData = await data.dataValues;
        var member;
        var memberResult = []
        await UserProfile_Group.findOne({where:{group_id:data.dataValues.id, isOwner:true}})
        .then(async (d) => {
            member = await newData.userProfiles.filter(profile => profile.id !== d.dataValues.userProfile_id)
            await UserProfile.findByPk(d.dataValues.userProfile_id)
            .then(owner => {
                newData.owner = owner.dataValues;
                // newData.member = member;
            })
            .then(async () => {
                await Promise.all(
                    member.map(m => {
                        const mm = {
                            id: m.id,
                            value: m.userEmail,
                            label: m.userName
                        }
                        memberResult.push(mm)
                    })
                );
                newData.member = memberResult;
            })
        })
        .then(async () => {
            var allUser = [];
            await UserProfile.findAll()
            .then(async (data) => {
                const a = await data.filter(d => d.id !== newData.owner.id)
                await Promise.all(
                    a.map((user) => {
                        const d = {
                            id: user.id,
                            value: user.userEmail,
                            label: user.userName
                        }
                        allUser.push(d)
                    })
                )
                newData.all = allUser;
            })
        })
        .then(() => {
            res.send(newData)
        })
    })
    .catch((err) => {
        console.log('Error occurred while getting a group.', err);
    })
}

// Print all alive Group
exports.getAll = (req, res) => {
    var userId = req.params.userId;
    var dataArr = [];
    var dataArrResult = [];
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
        await Promise.all(
            data.map(async (group) => {
                let activityNum = 0;
                await Activity.findAll({where: {bigGroup_id: group.id}})
                .then((activities) => {
                    // console.log(activities.length)
                    activityNum = activities.length;
                })
                .then(() => {
                    group.dataValues.activityNum = activityNum
                })
                .then(() => {
                    // console.log(group)
                    const nowDate = new Date();
                    const expiryDate = new Date(group.groupExpiryDate);
                    if(expiryDate > nowDate) {
                        dataArr.push(group);
                    }
                })
            })
        );
    })
    .then(async () => {
        await Promise.all(
            dataArr.map(async (group) => {
                for(const user of group.userProfiles) {
                    // console.log('1',user.id)
                    // console.log('2', userId)
                    if(user.id == userId){
                        // console.log('in')
                        dataArrResult.push(group);
                        break;
                    }
                }
            })
        );
        // console.log('result', dataArrResult);
        return res.send(dataArrResult);
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
    await Group.findOne({where: {groupMeetingId: id}})
    .then(async (group) => {
        await Activity.findAll({where: {bigGroup_id: group.dataValues.id}})
        .then((activity) => {
            try{
                sequelize.transaction(async (t) => {
                    await Promise.all(
                        activity.map(async (a) => {
                            Stage.destroy({where: {mainActivity_id: a.dataValues.id}, transaction: t})
                        })
                    );
                    await Activity.destroy({where: {bigGroup_id: group.dataValues.id}})
                })
            }catch(err){
                console.log('err', err)
            }
        })
    })
 
    Group.destroy({where: {groupMeetingId: id}})
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