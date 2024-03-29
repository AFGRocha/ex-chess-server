const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { v4: uuidV4 } = require('uuid')
const { Server } = require('socket.io');

app.set('view engine','ejs')
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "http://localhost:3000/EX-Chess/");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

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
    if(userIds[id] == null)
      userIds[id] = []
    if(userIds[id].length < 2) {
      userIds[id].push(socket.id)
      socket.join("room-"+id);
      io.sockets.in("room-"+id).emit('connected', id, socket.id);
      if(userIds[id].length === 2) {
        io.sockets.in("room-"+id).emit('player2-ready');
      }
    } 
    else {
      io.to(socket.id).emit('full-room');
    }
      
  })
  socket.on('disconnect', () => {
    console.log(`A user has disconnected ${socket.id}`);
    const index = Object.keys(userIds).find(key => userIds[key].includes(socket.id));
    delete userIds[index]
    io.sockets.in("room-"+index).emit('player-disconnected')
  })
  socket.on('piece-movement', (oldPosition, newPosition, roomId, player, isEx) => {
    let index  = ((player === 'player1') ? 1 : 0);
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

  socket.on('game-over', (roomId) => {
    
  })
});

server.listen(8080, () => {
  console.log('listening on *:8080');
});