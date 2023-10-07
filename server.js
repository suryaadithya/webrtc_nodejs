// server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));

io.on('connection', (socket) => {
    socket.on('join-room', (roomId) => {
        if (io.sockets.adapter.rooms[roomId] && io.sockets.adapter.rooms[roomId].length == 1) {
            socket.join(roomId);
            socket.emit('joined-room', roomId);
        } else if (!io.sockets.adapter.rooms[roomId]) {
            socket.join(roomId);
            socket.emit('created-room', roomId);
        } else {
            socket.emit('full-room', roomId);
        }
    });

    socket.on('signal', (toId, message) => {
        socket.to(toId).emit('signal', socket.id, message);
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
