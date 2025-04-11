const chatSocket = require('./chatSocket');
const passport = require('../config/passport-jwt');
const roomDb = require('../queries/roomQueries');
const userDb = require('../queries/userQueries');

const friendSocket = require('./friendSocket');
const activeUsers = require('./activeUsers');
const { updateFriends } = require('./socketFunctions');

const socketServer = (io) => {
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

    const setUserOnline = async () => {
      try {
        await userDb.userOnline({ userId, isOnline: true });
      } catch (error) {
        console.log(error);
      }
    };
    setUserOnline();
    updateFriends({ userId, io });
    chatSocket(io, socket);
    friendSocket(io, socket);

    socket.on('disconnect', async () => {
      if (activeUsers.get(userId)?.socketId === socket.id) {
        activeUsers.delete(userId);
      }
      const setUserOffline = async () => {
        try {
          await userDb.userOnline({ userId, isOnline: false });
        } catch (error) {
          console.log(error);
        }
      };
      setUserOffline();
      updateFriends({ userId, io });
      const roomId = socket.roomId;
      try {
        if (userId) {
          await roomDb.removeUserFromRoom(userId);
          io.to(roomId).emit('user_left', { userId });
        }
      } catch (error) {
        console.log('Error handling user disconnect:', error.message);
      }
    });
  });
};

module.exports = { socketServer };
