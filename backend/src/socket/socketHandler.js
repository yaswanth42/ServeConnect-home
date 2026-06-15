const { Server } = require('socket.io');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket Connected: ${socket.id}`);

    // Join room based on userId or role for targeted events
    socket.on('join', (data) => {
      const { userId, role } = data;
      if (userId) {
        socket.join(userId);
        console.log(`Socket ${socket.id} joined user room: ${userId}`);
      }
      if (role) {
        socket.join(role);
        console.log(`Socket ${socket.id} joined role room: ${role}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`Socket Disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io is not initialized yet!');
  }
  return io;
};

// Convenience helpers to emit events
const emitToUser = (userId, event, data) => {
  if (io) {
    io.to(userId).emit(event, data);
  }
};

const emitToRole = (role, event, data) => {
  if (io) {
    io.to(role).emit(event, data);
  }
};

module.exports = {
  initSocket,
  getIO,
  emitToUser,
  emitToRole
};
