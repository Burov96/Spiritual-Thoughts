import { io } from 'socket.io-client';

let socket;

export const initSocket = () => {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000', {
      path: '/api/socket',
    });
  }
  return socket;
};
