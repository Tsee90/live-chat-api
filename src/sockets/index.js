const chatSocket = require('./chatSocket');
const passport = require('../config/passport-jwt');
const roomDb = require('../queries/roomQueries');
const userDb = require('../queries/userQueries');

const activeUsers = new Map();

module.exports = (io) => {
  io.use((socket, next) => {
    passport.authenticate('jwt', { session: false }, (err, user) => {
      if (err) return next(new Error(`Authentication error: ${err.message}`));
      if (!user) return next(new Error('Authentication error: Invalid token'));
      socket.user = user;
      next();
    })({ headers: socket.handshake.headers });
  });

  io.on('connection', (socket) => {
    const userId = socket.user.id;

    if (activeUsers.has(userId)) {
      const existing = activeUsers.get(userId);
      io.to(existing.socketId).emit(
        'force_logout',
        'You have been logged out due to login from another device'
      );
      io.sockets.sockets.get(existing.socketId)?.disconnect();
    }

    activeUsers.set(userId, { socketId: socket.id });

    chatSocket(io, socket);

    socket.on('disconnect', async () => {
      if (activeUsers.get(userId)?.socketId === socket.id) {
        activeUsers.delete(userId);
      }
      const roomId = socket.roomId;
      try {
        if (userId) {
          await roomDb.removeUserFromRoom(userId);
          io.to(roomId).emit('user_left', { userId });
        }
      } catch (error) {
        console.error('Error handling user disconnect:', error.message);
      }
    });
  });
};
