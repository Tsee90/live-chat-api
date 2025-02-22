const chatSocket = require('./chatSocket');
const passport = require('../config/passport-jwt');

module.exports = (io) => {
  io.use((socket, next) => {
    passport.authenticate('jwt', { session: false }, (err, user) => {
      if (err) {
        return next(new Error(`Authentication error: ${err.message}`));
      }

      if (!user) {
        return next(new Error('Authentication error: Invalid token'));
      }

      socket.user = user;
      next();
    })({ headers: socket.handshake.headers });
  });
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    chatSocket(io, socket);

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });
};
