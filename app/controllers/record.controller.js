const db = require('../models');
const Record = db.records;
const sequelize = db.sequelize;
const Op = db.Sequelize.Op;
const fs = require('fs');
const path = require('path');

// Create a record
exports.createRecord = (req, res) => {
    const {buffer: recording} = req.files[0]
    const data = {
        recordAuthor: Object.assign({}, req.body).name,
        recordContent: `${new Date()}` + Object.assign({}, req.body).name,
        stage_id_record: req.params.stageId,
        team_id_record: req.params.teamId 
    }
    console.log('data', data)
    console.log('file', req.files[0])
    console.log('type', typeof(req.files[0]))
    fs.open(path.join(__dirname, `../audios/${data.recordContent}`), 'w+', (err, fd) => {
        console.log('fd', fd)
        fs.writeFile(fd, recording, (err) => {
            fs.close(fd, (err) => {
                res.send({message: 'saved!'})
            })
        })
    })
    Record.create(data)
    .then(() => {
        // res.send({message: 'received!'})
        console.log('received audio!')
    })
    .catch(err => {
        res.status(500).send({
            message:
            err.message || "Some error occurred while creating the recording."
        })
    })
}

// Get records
exports.getRecords = (req, res) => {
    console.log('calling here')
    Record.findAll({where: {[Op.and]: [{stage_id_record: req.params.stageId}, {team_id_record: req.params.teamId}]}})
    .then((data) => {
        console.log('original data', data)
        let datas = {
            info: data[0]
        }
        let fileName = data[0].dataValues.recordContent
        fs.readFile(path.join(__dirname, `../audios/${fileName}`), {encoding: 'base64'}, (err, data) => {
            if(err){
                res.status(500).send({
                    message:
                    err.message || 'Could not get the audio.'
                })
            } else {
                datas.recording = data;
                console.log('sended data', datas);
                res.send(datas)
            }
        })
    })
    .catch(err => {
        res.status(500).send({
            message:
            err.message || "Some error occurred while getting recordings."
        })
    })
}