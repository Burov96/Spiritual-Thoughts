import { Server } from 'socket.io';

export const config = {
  api: {
    bodyParser: false,
  },
};

const ioHandler = (req, res) => {
  if (!res.socket.server.io) {
    const io = new Server(res.socket.server);
    res.socket.server.io = io;

    io.on('connection', (socket) => {
      socket.on('typing', (data) => {
        socket.broadcast.emit('userTyping', data);
      });
    });
  }
  res.end();
};

export default ioHandler;
