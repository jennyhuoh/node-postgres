require('dotenv').config()
const fs = require('fs')
const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const { default: fetch } = require('node-fetch')
const jwt = require('jsonwebtoken')
const { response } = require('express')
const { Pool, Client } = require('pg');
const { SocketAddress } = require('net')

const app = express()
const port = 8000
const server = require('http').Server(app).listen(port, () => {console.log('open server on 3001')})
const io = require('socket.io')(server, {
    cors: { origin: '*'},
    methods: ["GET", "POST"],
    allowEI03: true
})

var socketUserMapping = {}
// Sockets
io.on('connection', (socket) => {
    console.log('new connection', socket.id);

    socket.on('joinRoom', async ({roomID, user}) => {
        let sendSocket = socket.id;
        const filterArr = Object.values(socketUserMapping)
        const index = filterArr.findIndex((item) => item.id === user.id);
        if(index !== -1) {
            console.log('find the original socketId', Object.keys(socketUserMapping)[index])
            delete socketUserMapping[Object.keys(socketUserMapping)[index]]
        } 
        socketUserMapping[socket.id] = user
        // new Map
        const peers = Array.from(io.sockets.adapter.rooms.get(roomID) || []) // clients
        console.log('socketUserMapping', socketUserMapping)
        peers.forEach(peerId => {
            io.to(peerId).emit('addPeer', {
                peerId: sendSocket,
                createOffer: false,
                user
            })
            socket.emit('addPeer', {
                peerId: peerId,
                createOffer: true,
                user: socketUserMapping[peerId]
            })
        })
        socket.join(roomID);
        console.log('peers', peers)
    })
    // Handle relay ice
    socket.on('relayIce', ({peerId, icecandidate}) => {
        io.to(peerId).emit('iceCandidate', {
            peerId: socket.id,
            icecandidate,
        })
    })
    // Handle relay sdp (session description)
    socket.on('relaySDP', ({peerId, sessionDescription}) => {
        io.to(peerId).emit('sessionDescription', {
            peerId: socket.id,
            sessionDescription
        })
    })
    // Handle mute/unmute
    socket.on('mute', ({roomId, userId}) => {
        const peers = Array.from(io.sockets.adapter.rooms.get(roomId) || [])
        peers.forEach(peerId => {
            io.to(peerId).emit('mute', {peerId:socket.id, userId})
        })
    })
    socket.on('unMute', ({roomId, userId}) => {
        const peers = Array.from(io.sockets.adapter.rooms.get(roomId) || [])
        peers.forEach(peerId => {
            io.to(peerId).emit('unMute', {peerId:socket.id, userId})
        })
    })
    // Team grouping button variable
    socket.on('openGroupDiscuss', async ({roomId, teamDetail}) => {
        console.log('teams', teamDetail)
        console.log('roomId', roomId)
        let stageId = teamDetail[0].stage_team.stage_id
        let base = [];
        const peers = Array.from(io.sockets.adapter.rooms.get(roomId) || [])
        console.log('peers in openDiscuss', peers)
        await Promise.all(teamDetail.map(async (team) => {
            await team.teamMembers.map((member) => {
                let item = {
                    user: member.id,
                    team: team.id
                }
                base.push(item)
            })
        })).then(() => {
            peers.forEach((peer) => {
                const id = socketUserMapping[peer].id.toString()
                console.log('base', base)
                const index = base.findIndex((item) => {return item.user.toString() === id})
                console.log('index', index)
                if(index !== -1) {
                    io.to(peer).emit('openGroupDiscuss', {
                        team: base[index].team,
                        stageId: stageId
                    })
                } 
                // else {
                //     io.to(key).emit('openGroupDiscuss', {team: base[0].team})
                // }
            })
        })
    })
    // Get message
    socket.on('message', ({userId, userName, message, time, room}) => {
        console.log('userId', userId)
        console.log('userName', userName)
        console.log('msg', message)
        console.log('time', time)
        console.log('room', room)
        io.sockets.in(room).emit('message', {
            userName: userName,
            message: message,
            time: time
        })
    })
    // Get announcement
    socket.on('sendAnnouncement', ({content, rooms}) => {
        // console.log('content', content)
        // console.log('rooms', rooms)
        rooms.forEach((room) => {
            // console.log('room forEach', room)
            io.sockets.in(`${room}`).emit('sendAnnouncement', {
                content: content
            })
        })
    })
    // Get raiseHand
    socket.on('raiseHand', ({name, room}) => {
        console.log('raise hand', room)
        io.sockets.in(room).emit('raiseHand', {
            name: name
        })
    })
    socket.on('closeMicGetNewData', ({mainRoomId}) => {
        console.log('got it', mainRoomId)
        io.sockets.in(mainRoomId).emit('closeMicGetNewData', {
            message: 'get a recording'
        })
    })
    // Leaving the room
    // const leaveRoom = 
    socket.on('leave', ({roomID}) => {
        console.log('leave roomID:', roomID)
        const {rooms} = socket;
        Array.from(rooms).forEach(roomId => {
            const peers = Array.from(io.sockets.adapter.rooms.get(roomId) || [])
            console.log('socketUserMapping[socket.id]', socketUserMapping[socket.id])
            peers.forEach(peerId => {
                if(Object.keys(socketUserMapping).length !== 0) {
                    io.to(peerId).emit('removePeer', {peerId: socket.id, userId: socketUserMapping[socket.id].id})
                    socket.emit('removePeer', {peerId: peerId, userId: socketUserMapping[peerId].id})
                }
            })
            socket.leave(roomID)
        })
        delete socketUserMapping[socket.id]
        console.log('leave!', socketUserMapping)
    })
})

// server.listen(port, () => {
//     console.log('listening on *: 3001')
// })

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(morgan('dev'))
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
app.get('/', (req, res) => {
    res.status(200).send('Hello World!');
})

const db = require('./app/models');
db.sequelize.sync()
.then(() => {
    console.log('Synced db.');
})
.catch((err) => {
    console.log('Failed to sync db: '+err.message);
})

const client = new Client({
    user: 'admin',
    host: '140.115.126.21',
    database: 'postgres_db',
    password: 'secret',
    port: 5432,
})
client.connect()
client.query('SELECT NOW()', (err, res) => {
    console.log("Error or responsWe:: ", err, res);
    client.end()
})

require('./app/routes/userProfile.routes')(app);
require('./app/routes/group.routes')(app);
require('./app/routes/activity.routes')(app);
require('./app/routes/stage.routes')(app);
require('./app/routes/team.routes')(app);
require('./app/routes/teamTemplate.routes')(app);

var multer = require('multer');
var upload = multer();
const records = require('./app/controllers/record.controller');
const { fstat } = require('fs')
// Create record
app.post('/api/stage/:stageId/team/:teamId/record', upload.any(), records.createRecord)
// Get records
app.get('/api/stage/:stageId/team/:teamId/records', records.getRecords);
