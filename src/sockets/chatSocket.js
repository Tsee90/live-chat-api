const db = require('../queries/messageQueries');
const roomDb = require('../queries/roomQueries');
const { updateFriends } = require('./socketFunctions');

module.exports = (io, socket) => {
  const username = socket.user.username;
  const userId = socket.user.id;
  socket.on('join_room', async ({ roomId }) => {
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

      socket.roomId = roomId;

      await roomDb.addUserToRoom(socket.user.id, roomId);

      socket.join(roomId);

      io.to(roomId).emit('joined_room', { user: socket.user });
      updateFriends({ userId, io });
    } catch (error) {
      socket.emit('error', 'Failed to join room');
    }
  });

  socket.on('send_message', async ({ message, createdAt }) => {
    const roomId = socket.roomId;
    const senderId = userId;
    const content = message;

    if (content.length > 2000) {
      socket.emit('error', 'Message too long');
      return;
    }
    try {
      const newMessage = await db.createMessage({
        roomId,
        senderId,
        content,
        createdAt,
      });
      const updatedRoom = await roomDb.getRoomById(roomId);
      const messages = updatedRoom.messages;
      io.to(roomId).emit('receive_message', { messages });
    } catch (error) {
      socket.emit('error', 'Failed to send message');
    }
  });

  socket.on('leave_room', async () => {
    const roomId = socket.roomId;
    try {
      socket.leave(roomId);
      await roomDb.removeUserFromRoom(userId);

      io.to(roomId).emit('user_left', { userId });
      updateFriends({ userId, io });
    } catch (error) {
      socket.emit('error', 'Failed to leave room');
    }
  });
};
