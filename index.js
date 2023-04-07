require('dotenv').config()

const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const { default: fetch } = require('node-fetch')
const jwt = require('jsonwebtoken')
const { response } = require('express')
const { Pool, Client } = require('pg');
const { SocketAddress } = require('net')

const app = express()
const port = 3001
const server = require('http').Server(app).listen(port, () => {console.log('open server on 3001')})
const io = require('socket.io')(server, {
    cors: {
        origin: 'http://localhost:3000',
    }
})

var users = {};
var socketToRoom = {};
var userInfo = []
function findNowRoom(socket) {
    return Object.keys(socket.rooms).find(room => {
        return room!== socket.id
    })
}
var socketUserMapping = {}
// Sockets
io.on('connection', (socket) => {
    console.log('new connection', socket.id);
// 這裡開始是mainRoom
    // socket.on('joinRoom', roomID => {
    //     console.log('roomID', roomID)
    //     console.log('socket.id', socket.id)
    //     if(users[roomID]) {
    //         users[roomID].push(socket.id);
    //     } else {
    //         users[roomID] = [socket.id];
    //     }
    //     socketToRoom[socket.id] = roomID;
    //     const usersInThisRoom = users[roomID].filter(id => id !== socket.id);
    //     socket.emit('allUsers', usersInThisRoom);
    // })


    socket.on('joinRoom', async ({roomID, user}) => {
        socketUserMapping[socket.id] = user
        // new Map
        const peers = Array.from(io.sockets.adapter.rooms.get(roomID) || []) // clients
        console.log('socketUserMapping', socketUserMapping)
        peers.forEach(peerId => {
            io.to(peerId).emit('addPeer', {
                peerId: socket.id,
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
    // Leaving the room
    const leaveRoom = ({roomID}) => {
        const {rooms} = socket;
        Array.from(rooms).forEach(roomId => {
            const peers = Array.from(io.sockets.adapter.rooms.get(roomId) || [])
            peers.forEach(peerId => {
                io.to(peerId).emit('removePeer', {peerId: socket.id, userId: socketUserMapping[socket.id]?.id})
                socket.emit('removePeer', {peerId: peerId, userId: socketUserMapping[peerId]?.id})
            })
            socket.leave(roomID)
        })
        delete socketUserMapping[socket.id]
    }
    socket.on('leave', leaveRoom)

    // socket.on('joinRoom', async (info) => {
    //     socket.join(info.roomID)
    //     socket.emit('addRoom', '您已加入聊天室!')
    //     io.sockets.to(info.roomID).emit('addRoomBroadcast',`${info.userName} 加入聊天室了!`);
    //     const nowRoom = findNowRoom(socket);
    //     if(nowRoom) {
    //         socket.leave(nowRoom)
    //     }
    //     var previousSocket = 0;
    //     const newInfo = {
    //         roomID: info.roomID,
    //         userName: info.userName,
    //         socketID: socket.id
    //     }
    //     if(userInfo.length!==0){
    //         await Promise.all(userInfo.map(async (user) => {
    //             if(user.userName === newInfo.userName && user.roomID === newInfo.roomID) {
    //                 previousSocket = await user.socketID;
    //                 delete socketToRoom[previousSocket];
    //             }
    //         }))
    //     }
    //     userInfo.push(newInfo);
    //     if(users[newInfo.roomID]) {
    //         users[newInfo.roomID].push(socket.id);
    //     } else {
    //         users[newInfo.roomID] = [socket.id];
    //     }
    //     if(previousSocket !== 0) {
    //         const a = await users[newInfo.roomID].filter(id => id !== previousSocket)
    //         users[newInfo.roomID] = await a;
    //     }
    //     socketToRoom[socket.id] = newInfo.roomID;

    //     console.log('roomID', newInfo.roomID)
    //     console.log('socket.id', socket.id)
    //     console.log('users', users)
    //     console.log('socketToRoom', socketToRoom)
    //     const usersInThisRoom = await users[newInfo.roomID].filter(id => id !== socket.id);
    //     console.log('userInThisRoom', usersInThisRoom)
    //     userInfo = userInfo.filter(item => item.socketID !== previousSocket)
    //     console.log('userInfo', userInfo)
    //     socket.emit('allUsers', usersInThisRoom);
    // })

    socket.on('sendingSignal', payload =>{
        io.to(payload.userToSignal).emit('userJoined', {signal: payload.signal, callerID: payload.callerID});
    })
    socket.on('returningSignal', payload =>{
        io.to(payload.callerID).emit('receivingReturnedSignal', {signal: payload.signal, id:socket.id});
    })

    // 這裡開始是audioRoom
    console.log('success connect!')
    socket.on('getMessage', message => {
        socket.emit('getMessage', message)
    })
    socket.on('getMessageAll', message => {
        io.sockets.emit('getMessageAll', message)
    })
    socket.on('getMessageLess', message => {
        socket.broadcast.emit('getMessageLess', message)
    })

    socket.on('addRoom', room => {
        // const nowRoom = Object.keys(socket.rooms).find(room => {
        //     return room !== socket.id
        // })
        const nowRoom = findNowRoom(socket);
        if(nowRoom) {
            socket.leave(nowRoom)
        }

        socket.join(room)
        // 發送給同一個房間除了自己以外的 Client
        socket.to(room).emit('addRoom', '有新人加入聊天室!')
        // 發送給在同一房間中的所有 Client
        io.sockets.in(room).emit('addRoom', '已加入聊天室!')
    })

    socket.on('peerconnectSignaling', message => {
        console.log('接收資料: ', message);

        const nowRoom = findNowRoom(socket);
        socket.to(nowRoom).emit('peerconnectSignaling', message)
    })

    socket.on('disConnection', () => {
        // const room = Object.keys(socket.rooms).find(room => {
        //     return room !== socket.id
        // })
        // await socket.to(room).emit('leaveRoom', `${message} 已離開聊天!`)
        console.log(`socket 用戶離開 ${socket.id}`)
        socket.emit('disConnection', '')
    })

    socket.on('disconnecttt', async (payload) => {
        const roomID = await socketToRoom[socket.id];
        let room = await users[roomID];
        if(room) {
            room = await room.filter(id => id!== socket.id);
            users[roomID] = await room;
        }
        console.log('roomID', roomID)
        socket.broadcast.to(roomID).emit('userLeft', {
            message: `${payload}離開了`,
            socketID: socket.id
        });
        // socket.emit('userLeft', {
        //     message: `${payload}離開了`,
        //     socketID: socket.id
        // });
        
        userInfo = userInfo.filter(info => info.socketID !== socket.id)
        delete socketToRoom[socket.id]
        console.log('disconnection')
    })
    socket.on('change', (payload) => {
        console.log('payload', payload)
        socket.broadcast.to(payload[payload.length - 1].room).emit('changge', payload);
        // socket.emit('changge', payload);
    })
})

// server.listen(port, () => {
//     console.log('listening on *: 3001')
// })

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(morgan('dev'))

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
    host: 'localhost',
    database: 'postgres_db',
    password: 'secret',
    port: 5432,
})
client.connect()
client.query('SELECT NOW()', (err, res) => {
    console.log("Error or response:: ", err, res);
    client.end()
})

require('./app/routes/userProfile.routes')(app);
require('./app/routes/group.routes')(app);
require('./app/routes/activity.routes')(app);
require('./app/routes/stage.routes')(app);
require('./app/routes/team.routes')(app);
require('./app/routes/teamTemplate.routes')(app);


app.get('/get-token', (req, res) => {
    const API_KEY = process.env.VIDEOSDK_API_KEY
    const SECRET_KEY = process.env.VIDEOSDK_SECRET_KEY

    const options = { expiresIn: '10m', algorithm: 'HS256'}

    const payload = {
        apikey: API_KEY,
        permissions: ["allow_join", "allow_mod"],
    }

    const token = jwt.sign(payload, SECRET_KEY, options)
    res.json({token})
})

app.post('/create-meeting/', (req, res) => {
    const token = req.body.token
    // const url = new URL('/v2/rooms',`${process.env.VIDEOSDK_API_ENDPOINT}`)
    // console.log(url)
    // const url = `${process.env.VIDEOSDK_API_ENDPOINT}/v2/rooms`
    const options = {
        method: 'POST',
        // token: token,
        headers: { authorization: token, "Content-Type": "application/json"},
    }
    console.log(req.body.token)
    console.log(token)
    console.log(options)
    fetch('https://api.videosdk.live/v2/rooms', options)
        .then((response) => response.json())
        .then((result) => res.json(result)) //result will contain meetingId
        .catch((error) => console.log('error', error))
})

app.get('/get-recordings', async(req, res) => {
    const token = req.body.token
    const roomId = req.body.roomId

    const options={
        method: 'GET',
        headers: { Authorization: token, "Content-Type": "application/json"},
    }
    fetch(`https://api.videosdk.live/v2/recordings?roomId=${roomId}`, options)
    // const data = await response.json()
    .then((response) => response.json)
    .then((result) => res.json(result))
    .catch((error) => console.log('error', error))
    // res.json();
    // console.log(data);
})

app.post('/validate-meeting/:meetingId', (req, res) => {
    const token = req.body.token
    const meetingId = req.params.meetingId

    const url = `${process.env.VIDEOSDK_API_ENDPOINT}/api/meetings/${meetingId}`
    
    const options = {
        method: 'POST',
        headers: { Authorization: token },
    }

    fetch(url, options)
        .then((response) => response.json())
        .then((result) => res.json(result))
        .catch((error) => console.log('error', error))
})

// app.listen(port, () => {
//     console.log(`App running on port ${port}.`)
// })