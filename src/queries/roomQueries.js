const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

module.exports.createRoom = async function ({
  name,
  userId,
  startsAt,
  expiresAt,
  active,
  latitude,
  longitude,
}) {
  if (
    !name ||
    !userId ||
    !startsAt ||
    !expiresAt ||
    latitude == null ||
    longitude == null
  ) {
    throw new Error('All parameters are required');
  }

  try {
    return await prisma.$queryRaw`
      INSERT INTO "Room" (id, name, "userId", "startsAt", "expiresAt", active, location)
      VALUES (
        gen_random_uuid(),
        ${name},
        ${userId},
        ${startsAt}::timestamp,
        ${expiresAt}::timestamp,
        ${active},
        ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)
      )
      RETURNING id, name, "userId", "startsAt", "expiresAt", active, ST_AsText(location) AS location;
    `;
  } catch (error) {
    throw new Error(`Failed to create room: ${error.message}`);
  }
};

module.exports.getRoomById = async function (roomId) {
  if (!roomId) throw new Error('Room ID is required');

  try {
    return await prisma.room.findUnique({
      where: { id: roomId },
    });
  } catch (error) {
    throw new Error(`Failed to retrieve room: ${error.message}`);
  }
};

module.exports.updateRoom = async function (
  roomId,
  { name, startsAt, expiresAt, active, latitude, longitude }
) {
  if (!roomId) throw new Error('Room ID is required');

  try {
    const updateData = { name, startsAt, expiresAt, active };

    if (latitude != null && longitude != null) {
      updateData.location = prisma.$executeRaw`ST_SetSRID(ST_MakePoint(${latitude}, ${longitude}), 4326)`;
    }

    return await prisma.room.update({
      where: { id: roomId },
      data: updateData,
    });
  } catch (error) {
    throw new Error(`Failed to update room: ${error.message}`);
  }
};

module.exports.deleteRoom = async function (roomId) {
  if (!roomId) throw new Error('Room ID is required');

  try {
    return await prisma.room.delete({
      where: { id: roomId },
    });
  } catch (error) {
    throw new Error(`Failed to delete room: ${error.message}`);
  }
};

module.exports.getNearbyRooms = async function ({
  latitude,
  longitude,
  radiusKm,
}) {
  console.log(latitude, longitude, radiusKm);
  if (latitude == null || longitude == null || !radiusKm) {
    throw new Error('Latitude, longitude, and radius are required');
  }

  try {
    return await prisma.$queryRaw`
      SELECT id, name, "userId", "startsAt", "expiresAt", active, 
             ST_AsText(location) AS location, 
             ST_X(location) as longitude, 
             ST_Y(location) as latitude
      FROM "Room"
      WHERE active = true AND ST_DWithin(
        location,
        ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography,
        ${radiusKm} * 1000
      );
    `;
  } catch (error) {
    throw new Error(`Failed to find nearby rooms: ${error.message}`);
  }
};

module.exports.addUserToRoom = async function (userId, roomId) {
  if (!userId || !roomId) throw new Error('User ID and Room ID are required');

  try {
    // Ensure the user is not already in another room
    return await prisma.user.update({
      where: { id: userId },
      data: { roomId },
    });
  } catch (error) {
    throw new Error(`Failed to add user to room: ${error.message}`);
  }
};

module.exports.removeUserFromRoom = async function (userId) {
  if (!userId) throw new Error('User ID is required');

  try {
    return await prisma.user.update({
      where: { id: userId },
      data: { roomId: null },
    });
  } catch (error) {
    throw new Error(`Failed to remove user from room: ${error.message}`);
  }
};

module.exports.getUsersInRoom = async function (roomId) {
  if (!roomId) throw new Error('Room ID is required');

  try {
    return await prisma.user.findMany({
      where: { roomId },
      select: { id: true, username: true },
    });
  } catch (error) {
    throw new Error(`Failed to get users in room: ${error.message}`);
  }
};

module.exports.updateExpiredRooms = async function () {
  try {
    await prisma.room.updateMany({
      where: {
        expiresAt: { lt: new Date() },
        active: true,
      },
      data: { active: false },
    });
  } catch (error) {
    throw new Error(`Failed to update expired rooms ${error.message}`);
  }
};
