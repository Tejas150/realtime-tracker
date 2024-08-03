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

let markers = {}
let routingControls = {}

io.on('connection', function (socket) {
    socket.on('send-location', (data) => {
        markers = { ...markers, ...data.markers }
        routingControls = { ...routingControls, ...data.routingControls }
        io.emit('recieve-location', {id: socket.id, ...data, markers, routingControls})
    })
    socket.on('disconnect', () => {
        delete markers[socket.id]
        delete routingControls[socket.id]
        io.emit('user-disconnected', socket.id)
    })
})

app.get('/', (req, res) => {
    res.render('index')
})

server.listen(process.env.PORT || 8080)