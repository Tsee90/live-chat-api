const db = require('../queries/messageQueries');
const roomDb = require('../queries/roomQueries');

module.exports = (io, socket) => {
  socket.on('join_room', async ({ userId, roomId }) => {
    try {
      const room = await roomDb.getRoomById(roomId);

      if (!room) {
        socket.emit('error', 'Room not found');
        return;
      }

      if (!room.active) {
        socket.emit('error', 'Room is not currently active');
        return;
      }
      socket.userId = userId;
      socket.roomId = roomId;

      // Ensure user is only in one room
      await roomDb.addUserToRoom(userId, roomId);

      socket.join(roomId);
      console.log(`User ${userId} (${socket.id}) joined room: ${roomId}`);

      io.to(roomId).emit('user_joined', `User ${userId} has joined the room.`);
    } catch (error) {
      socket.emit('error', 'Failed to join room');
    }
  });

  socket.on('send_message', async ({ roomId, message, senderId }) => {
    try {
      const newMessage = await db.createMessage({
        roomId,
        senderId,
        content: message,
      });

      io.to(roomId).emit('receive_message', {
        senderId,
        message,
        createdAt: newMessage.createdAt,
      });
      console.log(`Message from ${senderId} in ${roomId}: ${message}`);
    } catch (error) {
      socket.emit('error', 'Failed to send message');
    }
  });

  socket.on('leave_room', async ({ userId, roomId }) => {
    try {
      socket.leave(roomId);
      await roomDb.removeUserFromRoom(userId);

      console.log(`User ${userId} (${socket.id}) left room: ${roomId}`);
      io.to(roomId).emit('user_left', `User ${userId} has left the room.`);
    } catch (error) {
      socket.emit('error', 'Failed to leave room');
    }
  });

  socket.on('disconnect', async () => {
    try {
      const userId = socket.userId;
      if (userId) {
        await roomDb.removeUserFromRoom(userId);
        console.log(
          `User ${userId} (${socket.id}) disconnected and removed from room`
        );
      }
    } catch (error) {
      console.error('Error handling user disconnect:', error.message);
    }
  });
};
