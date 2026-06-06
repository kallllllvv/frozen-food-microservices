const { Server } = require('socket.io');

const ADMIN_ROOM = 'admin_room';

let io = null;

const normalizeEmail = (value) => String(value || '').trim().toLowerCase();

const getUserRoom = (email) => `user:${normalizeEmail(email)}`;

const initRealtime = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    socket.on('join_context', (payload = {}) => {
      const role = String(payload.role || '').trim().toLowerCase();
      const email = normalizeEmail(payload.email);

      if (role === 'admin') {
        socket.join(ADMIN_ROOM);
      }

      if (email) {
        socket.join(getUserRoom(email));
      }
    });
  });

  return io;
};

const getIO = () => io;

const emitToAll = (event, payload) => {
  if (!io) return;
  io.emit(event, payload);
};

const emitToAdmin = (event, payload) => {
  if (!io) return;
  io.to(ADMIN_ROOM).emit(event, payload);
};

const emitToUser = (email, event, payload) => {
  if (!io) return;
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return;
  io.to(getUserRoom(normalizedEmail)).emit(event, payload);
};

module.exports = {
  ADMIN_ROOM,
  initRealtime,
  getIO,
  emitToAll,
  emitToAdmin,
  emitToUser,
};
