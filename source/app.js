require('./db/mongoose')
const express = require('express')
const socketio = require('socket.io')
const http = require('http')
const path = require('path')
const bodyParser = require('body-parser')

const { User } = require('./models/user')
const { Record } = require('./models/record')
const res = require('express/lib/response')
const { generateMessage, generateLocation } = require('./public/js/messages')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = 3000
const publicDirectoryPath = path.join(__dirname + '/public')

app.use(express.static(publicDirectoryPath))

const urlencodedParser = bodyParser.urlencoded({ extended: false })

app.get('/sign-up', function (req, res) {
    res.sendFile(__dirname + '/public/sign-up.html')
})

app.post('/sign-up', urlencodedParser, async function (req, res) {
    const user = new User({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password
    })

    try {
        await user.save()
        res.status(200).redirect('/chat?email=' + user.email)
    } catch (error) {
        res.status(400).send({ error }) // handle error
    }
})

app.get('/login', function (req, res) {
    res.sendFile(__dirname + '/public/login.html')
})

app.post('/login', urlencodedParser, async function (req, res) {
    try {
        const user = await User.findByCredentials({
            email: req.body.email,
            password: req.body.password
        })
        res.status(200).redirect('/chat?email=' + user.email)
    } catch (error) {
        alert(error)
    }
})

app.get('/chat', function (req, res) {
    res.sendFile(__dirname + '/public/chat.html')
})

io.on('connection', function (socket) {
    
    socket.on('handshake', async function (options, callback) {
        var record = await Record.findOne({ email: options.email })
        if (!record) {
            record = new Record({
                email: options.email,
                connection_id: options.connection_id
            })
        } else {
            record.connection_id = options.connection_id
        }

        try {
            await record.save()
            callback(undefined)
        } catch (error) {
            callback(error)
        }   
    })

    socket.on('loadFriendsList', async function (email, callback) {
        try {
            const user = await User.findOne({ email })
            const friends = user.friends
            callback(undefined, friends)
        } catch (error) {
            callback(error)
        }
    })

    socket.on('searchFriend', async function (options, callback) {
        const email = options.email
        try {
            const user = await User.findOne({ email })
            callback(undefined, user)
        } catch (error) {
            callback(1, undefined)
        }
    })

    socket.on('sendFriendRequest', async function (email, socketid, callback) {
        try {
            const to = await Record.findOne({ email })
            const fromRecord = await Record.findOne({ connection_id: socketid })
            const from = await User.findOne({ email: fromRecord.email })
            callback(undefined)
            io.to(to.connection_id).emit('addFriendRequest', from)
        }  catch (error) {
            console.log(error)
        }
    })

    socket.on('addFriend', async function (from, callback) {
        const fromEmail = from.email
        const toId = socket.id

        try {
            const toRecord = await Record.findOne({ connection_id: toId })
            const fromRecord = await Record.findOne({ email: fromEmail })
            const to = await User.findOne({ email: toRecord.email })
            const from = await User.findOne({ email: fromEmail })
            to.addFriend(from)
            from.addFriend(to)
            callback(undefined)
            io.to(toRecord.connection_id).emit('addFriendToList', to)
            io.to(fromRecord.connection_id).emit('addFriendToList', from)
        } catch (error) {
            callback(500)
        }
    })

    socket.on('sendMessage', async function (options, callback) {
        try {
            const fromRecord = await Record.findOne({ connection_id: socket.id })
            const from = await User.findOne({ email: fromRecord.email })
            const toRecord = await Record.findOne({ email: options.toEmail })
            //save to database
            io.to(fromRecord.connection_id).emit('message', generateMessage("You", options.value))
            io.to(toRecord.connection_id).emit('message', generateMessage(from.name, options.value))
            callback(undefined)
        } catch (error) {
            console.log(error)
        }
    })

    socket.on('sendLocation', async function (options, callback) {
        try {
            const fromRecord = await Record.findOne({ connection_id: socket.id })
            const from = await User.findOne({ email: fromRecord.email })
            const toRecord = await Record.findOne({ email: options.toEmail })
            const url = 'https://google.com/maps?q=' + options.coords.latitude + ',' + options.coords.longitude
            //save to database
            io.to(fromRecord.connection_id).emit('locationMessage', generateLocation("You", url))
            io.to(toRecord.connection_id).emit('locationMessage', generateLocation(from.name, url))
            callback(undefined)
        } catch (error) {
            console.log(error)
        }
    })
})

server.listen(port, function () {
    console.log('Server is up on port ' + port)
})