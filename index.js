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

let userIds = []
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log(`User connected ${socket.id}`);
  socket.on('join-room', (id, userId) => {
    userIds.push(socket.id)
    socket.join("room-"+id);
    io.sockets.in("room-"+id).emit('connected', id, socket.id);
  })
  socket.on('disconnect', () => {
    console.log(`A user has disconnected ${socket.id}`);
  })
  socket.on('piece-movement', (oldPosition, newPosition, roomId, player) => {
    console.log(player)
    let index  = ((player === 'player1') ? 1 : 0);
    console.log(player+' is sending to  ' + userIds[index])
    io.sockets.in("room-"+roomId).emit('piece-movement-server', oldPosition, newPosition, player)
  })
  socket.on('ex-press', (roomId, player, isOn) => {
    io.sockets.in("room-"+roomId).emit('ex-press-server', isOn, player)
  })
});

server.listen(8080, () => {
  console.log('listening on *:8080');
});