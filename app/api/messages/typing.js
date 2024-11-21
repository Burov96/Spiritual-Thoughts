import { Server } from 'socket.io';

export const config = {
  api: { bodyParser: false },
};

const ioHandler = (res) => {
  if (!res.socket.server.io) {
    const io = new Server(res.socket.server);
    res.socket.server.io = io;

    io.on('connection', (socket) => {
      socket.on('typing', ({ roomId, user }) => {
        socket.to(roomId).emit('userTyping', user);
      });
    });
  }
  res.end();
};

export default ioHandler;
