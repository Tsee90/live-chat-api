const db = require('../queries/messageQueries');

module.exports.createMessage = async (req, res) => {
  try {
    const senderId = req.user.id;
    const messageData = { ...req.body, senderId };
    const newMessage = await db.createMessage(messageData);
    res.status(201).json(newMessage);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports.getMessageById = async (req, res) => {
  try {
    const message = await db.getMessageById(req.params.id);
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
    await db.deleteMessage(req.params.id);
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
