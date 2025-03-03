const db = require('../queries/roomQueries');

module.exports.createRoom = async (req, res) => {
  try {
    const userId = req.user.id;
    const { latitude, longitude } = req.body.location;
    const { startsAt, expiresAt, name } = req.body;
    const active = true;
    const roomData = {
      userId,
      name,
      active,
      latitude,
      longitude,
      startsAt,
      expiresAt,
      active,
    };
    const newRoom = await db.createRoom(roomData);
    res.status(201).json(newRoom[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports.getRoomById = async (req, res) => {
  try {
    const room = await db.getRoomById(req.params.roomId);
    if (!room) return res.status(404).json({ error: 'Room not found' });
    res.json(room);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports.updateRoom = async (req, res) => {
  try {
    const updatedRoom = await db.updateRoom(req.params.roomId, req.body);
    res.json(updatedRoom);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports.deleteRoom = async (req, res) => {
  try {
    await db.deleteRoom(req.params.roomId);
    res.json({ message: 'Room deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports.getRooms = async (req, res) => {
  try {
    const { sort, radiusKm } = req.query;
    let rooms = [];

    if (sort === 'userCount') {
      if (radiusKm === 'all') {
        rooms = await db.getAllRoomsSortCount();
      } else {
        rooms = await db.getNearbyRoomsSortUserCount(req.query);
        const formattedRooms = rooms.map((room) => ({
          ...room,
          user_count: Number(room.user_count),
        }));
        rooms = formattedRooms;
      }
    }

    if (sort === 'newest') {
      if (radiusKm === 'all') {
        rooms = await db.getAllRoomsSortNew();
      } else {
        rooms = await db.getNearbyRoomsSortNewest(req.query);
      }
    }
    res.json(rooms);
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: error.message });
  }
};

module.exports.joinRoom = async (req, res) => {
  try {
    const userId = req.user.id;
    const { roomId } = req.params;
    const room = await db.addUserToRoom(userId, roomId);
    res.status(200).json(room);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports.leaveRoom = async (req, res) => {
  try {
    const userId = req.user.id;
    const { roomId } = req.params;
    await db.removeUserFromRoom(userId);
    res.status(200).json({ message: 'Successfully left the room' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
