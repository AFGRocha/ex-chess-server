const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { v4: uuidV4 } = require('uuid')
const { Server } = require('socket.io');


app.set('view engine','ejs')
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "YOUR-DOMAIN.TLD"); // update to match the domain you will make the request from
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get('/', (req,res) => {
  console.log('root')
  res.send(`/${uuidV4()}`)
})

app.get('/:room', (req, res) => {
  console.log('room')
  res.send(`Room ID: ${req.params.room}`)
})


const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  const roomId = uuidV4()
  console.log(`User connected ${socket.id}`);
  socket.on('join-room', (id, userId) => {
    console.log(id, userId);
    io.emit('connected', roomId)
  })
  socket.on('disconnect', () => {
    console.log(`A user has disconnected ${socket.id}`);
  })
  socket.on('piece-movement', (oldPosition, newPosition) => {
    console.log('looptest')
    io.emit('piece-movement', oldPosition, newPosition)
  })
});

server.listen(8080, () => {
  console.log('listening on *:8080');
});