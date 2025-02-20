const db = require('../queries/roomQueries');

module.exports.createRoom = async (req, res) => {
  try {
    const userId = req.user.id;
    const roomData = { ...req.body, userId };
    const newRoom = await db.createRoom(roomData);
    res.status(201).json(newRoom);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports.getRoomById = async (req, res) => {
  try {
    const room = await db.getRoomById(req.params.id);
    if (!room) return res.status(404).json({ error: 'Room not found' });
    res.json(room);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports.updateRoom = async (req, res) => {
  try {
    const updatedRoom = await db.updateRoom(req.params.id, req.body);
    res.json(updatedRoom);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports.deleteRoom = async (req, res) => {
  try {
    await db.deleteRoom(req.params.id);
    res.json({ message: 'Room deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports.getNearbyRooms = async (req, res) => {
  try {
    const rooms = await db.getNearbyRooms(req.body);
    res.json(rooms);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
