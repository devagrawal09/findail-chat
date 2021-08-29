require('dotenv').config();
const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const formatMessage = require('./helpers/formatDate')
const {
  getActiveUser,
  exitRoom,
  newUser,
  getIndividualRoomUsers
} = require('./helpers/userHelper');
const { generateAnswer } = require('./helpers/botResponse');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Set public directory
app.use(express.static(path.join(__dirname, 'public')));

// this block will run when the client connects
io.on('connection', socket => {
  socket.on('joinRoom', ({ username, room }) => {
    const user = newUser(socket.id, username, room);

    socket.join(user.room);

    // General welcome
    socket.emit('message', formatMessage("WebCage", 'Messages are limited to this room! '));

    // Broadcast everytime users connects
    socket.broadcast
      .to(user.room)
      .emit(
        'message',
        formatMessage("WebCage", `${user.username} has joined the room`)
      );

    // Current active users and room name
    io.to(user.room).emit('roomUsers', {
      room: user.room,
      users: getIndividualRoomUsers(user.room)
    });
  });

  // Listen for client message
  socket.on('chatMessage', async msg => {
    const user = getActiveUser(socket.id);

    io.to(user.room).emit('message', formatMessage(user.username, msg));

    if(user.room === `bot`) {
      const botResponse = await generateAnswer(`Question: ${msg}`);
      io.to(user.room).emit('message', formatMessage(`JerryBot`, botResponse));
    }
  });

  // Runs when client disconnects
  socket.on('disconnect', () => {
    const user = exitRoom(socket.id);

    if (user) {
      io.to(user.room).emit(
        'message',
        formatMessage("WebCage", `${user.username} has left the room`)
      );

      // Current active users and room name
      io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: getIndividualRoomUsers(user.room)
      });
    }
  });
});

app.get('/advisor', (req, res) => {
  res.redirect('chat.html?room=advice&username=Dev+Agrawal');
});

app.get('/join', (req, res) => {
  res.redirect(`chat.html?room=advice&username=${req.query.username || `Andy`}`);
});

app.get('/bot', (req, res) => {
  res.redirect(`chat.html?room=bot&username=${req.query.username || `Andy`}`);
});

newUser(`bot`, `JerryBot`, `bot`);

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));