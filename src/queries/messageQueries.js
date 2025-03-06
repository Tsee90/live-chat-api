const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

module.exports.createMessage = async function ({
  content,
  senderId,
  roomId,
  createdAt = new Date().toISOString(),
}) {
  if (!content || !senderId || !roomId) {
    throw new Error('Content, sender ID, and room ID are required');
  }
  try {
    return await prisma.message.create({
      data: { content, senderId, roomId, createdAt },
      include: {
        sender: {
          select: { username: true },
        },
      },
    });
  } catch (error) {
    throw new Error(`Failed to create message: ${error.message}`);
  }
};

module.exports.getMessageById = async function (messageId) {
  if (!messageId) throw new Error('Message ID is required');

  try {
    return await prisma.message.findUnique({
      where: { id: messageId },
      include: { sender: true, room: true }, // Fetch sender and room info
    });
  } catch (error) {
    throw new Error(`Failed to retrieve message: ${error.message}`);
  }
};

module.exports.getMessagesByRoom = async function (roomId) {
  if (!roomId) throw new Error('Room ID is required');

  try {
    return await prisma.message.findMany({
      where: { roomId },
      orderBy: { createdAt: 'asc' }, // Sort messages chronologically
      include: { sender: true },
    });
  } catch (error) {
    throw new Error(`Failed to retrieve messages: ${error.message}`);
  }
};

module.exports.updateMessage = async function (messageId, { content }) {
  if (!messageId) throw new Error('Message ID is required');
  if (!content) throw new Error('Content is required');

  try {
    return await prisma.message.update({
      where: { id: messageId },
      data: { content },
    });
  } catch (error) {
    throw new Error(`Failed to update message: ${error.message}`);
  }
};

module.exports.deleteMessage = async function (messageId) {
  if (!messageId) throw new Error('Message ID is required');

  try {
    return await prisma.message.delete({
      where: { id: messageId },
    });
  } catch (error) {
    throw new Error(`Failed to delete message: ${error.message}`);
  }
};
