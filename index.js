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

const users = {};
const socketToRoom = {};

function findNowRoom(socket) {
    return Object.keys(socket.rooms).find(room => {
        return room!== socket.id
    })
}

io.on('connection', (socket) => {
// 這裡開始是mainRoom
    socket.on('joinRoom', roomID => {
        if(users[roomID]) {
            users[roomID].push(socket.id);
        } else {
            users[roomID] = [socket.id];
        }
        socketToRoom[socket.id] = roomID;
        const usersInThisRoom = users[roomID].filter(id => id!== socket.id);
        socket.emit('allUsers', usersInThisRoom);
    })
    socket.on('sendingSignal', payload =>{
        io.to(payload.userToSignal).emit('userJoined', {signal: payload.signal, callerId: payload.callerId});
    })
    socket.on('returningSignal', payload =>{
        io.to(payload.callerId).emit('receivingReturnedSignal', {signal: payload.signal, id:socket.id});
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

    socket.on('disconnect', () => {
        const roomID = socketToRoom[socket.id];
        let room = users[roomID];
        if(room) {
            room = room.filter(id => id!== socket.id);
            users[roomID] = room;
        }
        console.log('disconnection')
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