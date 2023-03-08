const db = require('../models');
const TeamTemplate = db.teamTemplates;
const Team = db.teams;
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
