const express = require('express')
const app = express()
const http = require('http')

const socketio = require('socket.io')
const server = http.createServer(app)
const io = socketio(server)

const path = require('path')
app.set('view engine', 'ejs')
app.use(express.static(path.join(__dirname, '/public')))

const cors = require('cors')
app.use(cors())

io.on('connection', function (socket) {
    socket.on('send-location', (data) => {
        io.emit('recieve-location', {id: socket.id, ...data})
    })
    socket.on('disconnect', () => {
        io.emit('user-disconnected', socket.id)
    })
})


app.get('/', (req, res) => {
    res.render('index')
})

server.listen(8080)