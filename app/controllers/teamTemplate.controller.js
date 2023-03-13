const db = require('../models');
const TeamTemplate = db.teamTemplates;
const Team = db.teams;
const UserProfile_Group = db.userProfile_group;
const UserProfile = db.userProfiles;
const sequelize = db.sequelize;
const Op = db.Sequelize.Op;

// Create and save an teamTemplate for a user
exports.createForUser = (req, res) => {
    const teamTemplate = {
        teamTemplateName: req.body.teamTemplateName,
        userTemplate_id: req.body.userId
    }
    TeamTemplate.create(teamTemplate)
    .then((data) => {
        try{
            sequelize.transaction(async (t) => {
                await Promise.all(
                    req.body.teamId.map(async (id) => {
                        await Team.update({teamTemplate_id: data.id}, {where: {id: id}, transaction: t})
                    })
                );
                res.send({message:'success'})
            })
        } catch(err) {
            console.log('err', err);
        }
    })
    .catch((err) => {
        res.status(500).send({
            message:
            err.message || 'Some error occurred while creating a team template.'
        })
    })
}

// 進入分組介面(點擊分組)要出現可以給user選擇的分組樣板
// 在teamTemplate找到user(userTemplate_id)擁有的template(id)
// 每個template(teamTemplate_id)關連到team table，儲存該teamTemplate的teamMembers是否與此groupId的所有users吻合
exports.getTemplates = async (req, res) => {
    const groupId = req.params.groupId;
    const userId = req.body.userId;
    var thisGroupMembers = [];
    var resultTemplate = [];

    await UserProfile_Group.findAll({where: {group_id: groupId, isOwner: false}})
    .then(async (data) => {
        await Promise.all(
            data.map(async (d) => {
                await UserProfile.findByPk(d.dataValues.userProfile_id)
                .then((user) => {
                    const info = {
                        userName: user.dataValues.userName,
                        userEmail: user.dataValues.userEmail
                    }
                    thisGroupMembers.push(info);
                })
            })
        );
    })
    .then(async () => {
        await TeamTemplate.findAll({where: {userTemplate_id: userId}})
        .then(async (data) => {
            if(data){
                data.map(async (template) =>{
                    await Team.findAll({where: {teamTemplate_id: template.dataValues.id}})
                    .then(async (teams) => {
                        var members = [];
                        await Promise.all(
                            teams.map((team) => {
                                members = members.concat(team.dataValues.teamMembers)
                            })
                        )
                        if(JSON.stringify(members.sort().toString()) === JSON.stringify(thisGroupMembers.sort().toString())) {
                            resultTemplate.push(template.dataValues)
                        }
                    })
                })
            }
        })
    })
    .then(() => {
        res.send(resultTemplate)
    })
    .catch((err) => {
        res.status(500).send({
            message:
            err.message || 'Some error occurred while getting usable team templates.'
        })
    })
}

// user點擊template選項，給予user每個team的成員
exports.giveTeamMembers = (req, res) => {
    const templateId = req.params.teamTemplateId;
    Team.findAll({where: {teamTemplate_id: templateId}})
    .then((data) => {
        res.send(data)
    })
    .catch((err) => {
        res.status(500).send({
            message:
            err.message || 'Some error occurred while giving the team template.'
        })
    })
}