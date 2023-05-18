const db = require('../models');
const Record = db.records;
const sequelize = db.sequelize;
const Op = db.Sequelize.Op;
const fs = require('fs');
const { request } = require('http');
const path = require('path');

// Create a record
exports.createRecord = async (req, res) => {
    const {buffer: recording} = req.files[0]
    let data = {
        recordAuthor: Object.assign({}, req.body).name,
        recordAuthorId: Object.assign({}, req.body).userId,
        recordContent: `${new Date()}` + Object.assign({}, req.body).name,
        stage_id_record: req.params.stageId,
        team_id_record: req.params.teamId,
        recordTargetId: Object.assign({}, req.body).targetId,
        recordTargetName: Object.assign({}, req.body).targetName, 
    }
    // console.log('data', data)
    // console.log('file', req.files[0])
    // console.log('type', typeof(req.files[0]))
    fs.open(path.join(__dirname, `../audios/${data.recordContent}`), 'w+', (err, fd) => {
        // console.log('fd', fd)
        fs.writeFile(fd, recording, (err) => {
            fs.close(fd, (err) => {
                res.send({message: 'saved!'})
            })
        })
    })
    
    if(data.recordTargetId !== undefined) {
        await Record.create(data)
        .then(() => {
            console.log('received audio!') 
        })
    } else {
        console.log('here')
        console.log('see data', data)
        await Record.findAll({where: {[Op.and]: [{stage_id_record: parseInt(data.stage_id_record)}, {team_id_record: data.team_id_record}]}})
        .then(async (all) => {
            console.log('here here') 
            console.log('all', all)
            if(all.length === 0) {
                data.recordTargetName = await data.recordAuthor
                data.recordTargetId = await data.recordAuthorId
                console.log('i am in here print data', data)
                await Record.create(data)
                .then(() => {
                    // res.send({message: 'received!'})
                    console.log('received audio!')
                })
            } else {
                console.log('which all', all[all.length-1].dataValues)
                data.recordTargetId = await all[all.length-1].dataValues.recordAuthorId
                data.recordTargetName = await all[all.length-1].dataValues.recordAuthor
                console.log('i am in here 2 print data', data)
                await Record.create(data)
                .then(() => {
                    // res.send({message: 'received!'})
                    console.log('received audio!')
                }) 
            }
        })
        .catch(err => {
            res.status(500).send({
                message:
                err.message || "Some error occurred while getting recordings."
            })
        }) 
    }
   
}

// Get records
exports.getRecords = (req, res) => {
    // console.log('calling here')
    let result = [];
    const readAllFiles = async(files) => {
        let promises = [];
        for(const f of files) {
            promises.push(fs.promises.readFile(path.join(__dirname, `../audios/${f.dataValues.recordContent}`), {encoding: 'base64'}))
        }
        // console.log('promises', promises)
        return Promise.all(promises)
    }
    async function run(files) {
        readAllFiles(files)
        .then(async (contents) => {
            // console.log('contents', contents)
            await Promise.all(files.map((info) => {
                // console.log('info', info)
                const index = files.findIndex(file => { return file.id === info.id})
                let data = {
                    info: info,
                    recordings: contents[index]
                }
                result.push(data)
            }))
            res.send(result)
        })
        .catch((err) => {
            console.log('err', err)
        })
    }
    Record.findAll({where: {[Op.and]: [{stage_id_record: req.params.stageId}, {team_id_record: req.params.teamId}]}})
    .then(async (data) => {
        run(data)
        // console.log('original data', data)
    })
    .catch(err => {
        res.status(500).send({
            message:
            err.message || "Some error occurred while getting recordings."
        })
    })
}