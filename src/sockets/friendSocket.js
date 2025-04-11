const activeUsers = require('./activeUsers');
module.exports = (io, socket) => {
  socket.on('friend_update', async ({ userId, targetUserId }) => {
    const user = activeUsers.get(userId);
    const target = activeUsers.get(targetUserId);
    if (user) {
      io.to(user.socketId).emit('friend_updated');
    }
    if (target) {
      io.to(target.socketId).emit('friend_updated');
    }
  });
};
