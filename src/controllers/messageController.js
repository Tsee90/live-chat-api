const db = require('../queries/messageQueries');

module.exports.createMessage = async (req, res) => {
  try {
    console.log('creating message...');
    const senderId = req.user.id;
    const { roomId } = req.params;
    const { content } = req.body;
    const messageData = { content, roomId, senderId };
    const newMessage = await db.createMessage(messageData);
    res.status(201).json(newMessage);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports.getMessageById = async (req, res) => {
  try {
    const message = await db.getMessageById(req.params.messageId);
    if (!message) return res.status(404).json({ error: 'Message not found' });
    res.json(message);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports.getMessagesByRoom = async (req, res) => {
  try {
    const messages = await db.getMessagesByRoom(req.params.roomId);
    res.json(messages);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports.deleteMessage = async (req, res) => {
  try {
    await db.deleteMessage(req.params.messageId);
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
