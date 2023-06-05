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
    if(userIds.length < 2) {
      userIds.push(socket.id)
      socket.join("room-"+id);
      io.sockets.in("room-"+id).emit('connected', id, socket.id);
    } 
    else {
      io.to(socket.id).emit('full-room');
    }
      
  })
  socket.on('disconnect', () => {
    console.log(`A user has disconnected ${socket.id}`);
  })
  socket.on('piece-movement', (oldPosition, newPosition, roomId, player, isEx) => {
    console.log(player)
    let index  = ((player === 'player1') ? 1 : 0);
    console.log(player+' is sending to  ' + userIds[index])
    io.sockets.in("room-"+roomId).emit('piece-movement-server', oldPosition, newPosition, player, isEx)
  })
  socket.on('ex-press', (roomId, player, isOn) => {
    io.sockets.in("room-"+roomId).emit('ex-press-server', isOn, player)
  })

  socket.on('ex-spend-meter', (roomId, player, ammount) => {
    io.sockets.in("room-"+roomId).emit('ex-spend-meter-server', player, ammount)
  })

  socket.on('kill', (roomId, player, killablePiecePosition) => {
    io.sockets.in("room-"+roomId).emit('kill-piece-from-server', player, killablePiecePosition)
  })

  socket.on('specific-ex-move', (roomId, player, blockingPiecePosition, piece) => {
    io.sockets.in("room-"+roomId).emit('ex-move-from-server', player, blockingPiecePosition, piece)
  })

  socket.on('queen-ex-move', (roomId, player, kingPosition, queenPosition) => {
    io.sockets.in("room-"+roomId).emit('queen-ex-move-from-server', player, kingPosition, queenPosition)
  })

  socket.on('king-state', (roomId, player, checkmate) => {
    io.sockets.in("room-"+roomId).emit('king-state-animation', player, checkmate)
  })
});

server.listen(8080, () => {
  console.log('listening on *:8080');
});