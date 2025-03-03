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
        ST_SetSRID(ST_MakePoint(${longitude}::DOUBLE PRECISION, ${latitude}::DOUBLE PRECISION), 4326)
      )
      RETURNING id, name, "userId", "startsAt", "expiresAt", active, ST_AsText(location) AS location;
    `;
  } catch (error) {
    console.log(error);
    throw new Error(`Failed to create room: ${error.message}`);
  }
};

module.exports.getRoomById = async function (roomId) {
  if (!roomId) throw new Error('Room ID is required');

  try {
    return await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        messages: {
          orderBy: {
            createdAt: 'asc',
          },
          include: {
            sender: {
              select: { username: true },
            },
          },
        },
        users: true,
      },
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
        ST_SetSRID(ST_MakePoint(${longitude}::DOUBLE PRECISION, ${latitude}::DOUBLE PRECISION), 4326)::geography,
        ${radiusKm}::DOUBLE PRECISION * 1000
      );
    `;
  } catch (error) {
    throw new Error(`Failed to find nearby rooms: ${error.message}`);
  }
};

module.exports.getNearbyRoomsSortUserCount = async function ({
  latitude,
  longitude,
  radiusKm,
}) {
  if (latitude == null || longitude == null || !radiusKm) {
    throw new Error('Latitude, longitude, and radius are required');
  }

  try {
    const rooms = await prisma.$queryRaw`
      SELECT r.id, r.name, r."userId", r."startsAt", r."expiresAt", r.active, 
             ST_AsText(r.location) AS location, 
             ST_X(r.location) as longitude, 
             ST_Y(r.location) as latitude,
             COUNT(u."id") AS user_count,
             creator.username AS creator_username
      FROM "Room" r
      LEFT JOIN "User" u ON r.id = u."roomId"
      LEFT JOIN "User" creator ON r."userId" = creator.id
      WHERE r.active = true AND ST_DWithin(
        r.location,
        ST_SetSRID(ST_MakePoint(${longitude}::DOUBLE PRECISION, ${latitude}::DOUBLE PRECISION), 4326)::geography,
        ${radiusKm}::DOUBLE PRECISION * 1000
      )
      GROUP BY r.id, creator.username
      ORDER BY user_count DESC; 
    `;
    return rooms.map((room) => ({
      ...room,
      user_count: Number(room.user_count),
    }));
  } catch (error) {
    console.error(error);
    throw new Error(`Failed to find nearby rooms: ${error.message}`);
  }
};

module.exports.getNearbyRoomsSortNewest = async function ({
  latitude,
  longitude,
  radiusKm,
}) {
  if (latitude == null || longitude == null || !radiusKm) {
    throw new Error('Latitude, longitude, and radius are required');
  }

  try {
    const rooms = await prisma.$queryRaw`
      SELECT r.id, r.name, r."userId", r."startsAt", r."expiresAt", r.active, 
             ST_AsText(r.location) AS location, 
             ST_X(r.location) AS longitude, 
             ST_Y(r.location) AS latitude,
             COUNT(u."id") AS user_count,
             creator.username AS creator_username
      FROM "Room" r
      LEFT JOIN "User" u ON r.id = u."roomId"
      LEFT JOIN "User" creator ON r."userId" = creator.id
      WHERE r.active = true 
        AND ST_DWithin(
          r.location,
          ST_SetSRID(ST_MakePoint(${longitude}::DOUBLE PRECISION, ${latitude}::DOUBLE PRECISION), 4326)::geography,
          ${radiusKm}::DOUBLE PRECISION * 1000
        )
      GROUP BY r.id, creator.username
      ORDER BY r."startsAt" DESC;  -- Sort by newest rooms
    `;

    return rooms.map((room) => ({
      ...room,
      user_count: Number(room.user_count), // Convert BigInt to Number
    }));
  } catch (error) {
    console.error(error);
    throw new Error(`Failed to find nearby rooms: ${error.message}`);
  }
};

module.exports.getAllRoomsSortCount = async function () {
  try {
    const rooms = await prisma.room.findMany({
      where: { active: true },
      include: {
        _count: {
          select: { users: true },
        },
        creator: {
          select: { username: true },
        },
      },
      orderBy: {
        users: {
          _count: 'desc',
        },
      },
    });

    return rooms.map((room) => ({
      ...room,
      user_count: room._count.users,
      creator_username: room.creator.username,
    }));
  } catch (error) {
    throw new Error(`Failed to find nearby rooms: ${error.message}`);
  }
};

module.exports.getAllRoomsSortNew = async function () {
  try {
    const rooms = await prisma.room.findMany({
      where: { active: true },
      include: {
        _count: {
          select: { users: true },
        },
        creator: {
          select: { username: true },
        },
      },
      orderBy: { startsAt: 'desc' },
    });
    return rooms.map((room) => ({
      ...room,
      user_count: room._count.users,
      creator_username: room.creator.username,
    }));
  } catch (error) {
    throw new Error(`Failed to find nearby rooms: ${error.message}`);
  }
};

module.exports.addUserToRoom = async function (userId, roomId) {
  if (!userId || !roomId) throw new Error('User ID and Room ID are required');

  try {
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
        expiresAt: { lt: new Date().toISOString() },
        active: true,
      },
      data: { active: false },
    });
  } catch (error) {
    throw new Error(`Failed to update expired rooms ${error.message}`);
  }
};

module.exports.updateEmptyRooms = async function () {
  try {
    await prisma.room.updateMany({
      where: {
        users: { none: {} },
        active: true,
      },
      data: { active: false },
    });
  } catch (error) {
    throw new Error(`Failed to deactivate empty rooms: ${error.message}`);
  }
};
