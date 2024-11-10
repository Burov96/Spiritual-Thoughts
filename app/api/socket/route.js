import { Server } from 'socket.io';

let io;

export async function GET(req) {
  if (!io) {
    const protocol = req.headers.get('x-forwarded-proto') || 'http';
    const host = req.headers.get('host');
    const baseUrl = `${protocol}://${host}`;

    io = new Server({
      path: '/api/socket',
      addTrailingSlash: false,
      cors: {
        origin: baseUrl,
        methods: ['GET', 'POST'],
      },
    });

    io.on('connection', socket => {
      console.log('Client connected');
      
      socket.on('newMessage', message => {
        socket.broadcast.emit('receiveMessage', message);
      });

      socket.on('typing', data => {
        socket.broadcast.emit('userTyping', data);
      });
    });
  }

  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,OPTIONS',
    },
  });
}
