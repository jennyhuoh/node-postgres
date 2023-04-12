const db = require('../models');
const Record = db.records;
const sequelize = db.sequelize;
const Op = db.Sequelize.Op;

// Create a record
exports.createRecord = (req, res) => {
    // const stageId = req.params.stageId;
    // const teamId = req.params.teamId;
    // let formData = req.body;
    // let files = req.files;
    const data = {
        recordAuthor: Object.assign({}, req.body).name,
        recordContent: req.files,
        stage_id_record: req.params.stageId,
        team_id_record: req.params.teamId 
    }
    // console.log('formData', formData);
    // console.log('file', typeof(files))
    Record.create(data)
    .then(() => {
        res.send({message: 'received!'})
        console.log('receive audio!')
    })
    .catch(err => {
        res.status(500).send({
            message:
            err.message || "Some error occurred while creating the recording."
        })
    }) 


   
}