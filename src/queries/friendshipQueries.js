const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

module.exports.getFriendRequest = async ({ userId1, userId2 }) => {
  try {
    const friendRequest = await prisma.friendship.findFirst({
      where: {
        OR: [
          { senderId: userId1, receiverId: userId2 },
          { senderId: userId2, receiverId: userId1 },
        ],
      },
    });

    if (!friendRequest) {
      return null;
    }

    return friendRequest;
  } catch (error) {
    throw new Error(`Failed to get friend request: ${error.message}`);
  }
};

module.exports.createFriendRequest = async function ({ senderId, receiverId }) {
  if (!senderId || !receiverId)
    throw new Error('Both sender and receiver IDs are required');

  try {
    return await prisma.friendship.create({
      data: {
        senderId,
        receiverId,
        status: 'PENDING',
      },
    });
  } catch (error) {
    throw new Error(`Failed to create friend request: ${error.message}`);
  }
};

module.exports.acceptFriendRequest = async function ({ senderId, receiverId }) {
  if (!senderId || !receiverId)
    throw new Error('Sender and receiver IDs are required');

  try {
    return await prisma.friendship.updateMany({
      where: {
        senderId,
        receiverId,
        status: 'PENDING',
      },
      data: {
        status: 'ACCEPTED',
      },
    });
  } catch (error) {
    throw new Error(`Failed to accept friend request: ${error.message}`);
  }
};

module.exports.declineFriendRequest = async function ({
  senderId,
  receiverId,
}) {
  if (!senderId || !receiverId)
    throw new Error('Sender and receiver IDs are required');

  try {
    return await prisma.friendship.updateMany({
      where: {
        senderId,
        receiverId,
        status: 'PENDING',
      },
      data: {
        status: 'DECLINED',
      },
    });
  } catch (error) {
    throw new Error(`Failed to decline friend request: ${error.message}`);
  }
};

module.exports.cancelFriendRequest = async ({ senderId, receiverId }) => {
  try {
    // Attempt to delete the friend request
    const deletedRequest = await prisma.friendship.deleteMany({
      where: {
        senderId,
        receiverId,
      },
    });

    if (deletedRequest.count === 0) {
      throw new Error('Friend request not found or already canceled');
    }

    return { message: 'Friend request canceled successfully' };
  } catch (error) {
    console.error('Error canceling friend request:', error);
    throw new Error(
      'An unexpected error occurred while canceling the friend request'
    );
  }
};

module.exports.getUserFriends = async function (userId) {
  if (!userId) throw new Error('User ID is required');

  try {
    return await prisma.friendship.findMany({
      where: {
        OR: [
          { senderId: userId, status: 'ACCEPTED' },
          { receiverId: userId, status: 'ACCEPTED' },
        ],
      },
      include: {
        sender: true,
        receiver: true,
      },
    });
  } catch (error) {
    throw new Error(`Failed to retrieve friends: ${error.message}`);
  }
};

module.exports.getPendingFriendRequests = async function (userId) {
  if (!userId) throw new Error('User ID is required');

  try {
    return await prisma.friendship.findMany({
      where: {
        OR: [
          { senderId: userId, status: 'PENDING' },
          { receiverId: userId, status: 'PENDING' },
        ],
      },
      include: {
        sender: true,
        receiver: true,
      },
    });
  } catch (error) {
    throw new Error(
      `Failed to retrieve pending friend requests: ${error.message}`
    );
  }
};

module.exports.unfriendUser = async function ({ userId1, userId2 }) {
  if (!userId1 || !userId2) throw new Error('Both user IDs are required');

  try {
    return await prisma.friendship.deleteMany({
      where: {
        OR: [
          { senderId: userId1, receiverId: userId2, status: 'ACCEPTED' },
          { senderId: userId2, receiverId: userId1, status: 'ACCEPTED' },
        ],
      },
    });
  } catch (error) {
    throw new Error(`Failed to unfriend: ${error.message}`);
  }
};

module.exports.getSentFriendRequests = async function (senderId) {
  if (!senderId) throw new Error('Sender ID is required');

  try {
    return await prisma.friendship.findMany({
      where: {
        senderId,
        status: 'PENDING',
      },
      include: {
        receiver: true,
      },
    });
  } catch (error) {
    throw new Error(`Failed to retrieve sent requests: ${error.message}`);
  }
};

module.exports.getReceivedFriendRequests = async function (receiverId) {
  if (!receiverId) throw new Error('Receiver ID is required');

  try {
    return await prisma.friendship.findMany({
      where: {
        receiverId,
        status: 'PENDING',
      },
      include: {
        sender: true,
      },
    });
  } catch (error) {
    throw new Error(`Failed to retrieve received requests: ${error.message}`);
  }
};

module.exports.areUsersFriends = async function ({ userId1, userId2 }) {
  if (!userId1 || !userId2) throw new Error('Both user IDs are required');

  try {
    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { senderId: userId1, receiverId: userId2, status: 'ACCEPTED' },
          { senderId: userId2, receiverId: userId1, status: 'ACCEPTED' },
        ],
      },
    });
    return friendship !== null;
  } catch (error) {
    throw new Error(`Failed to check friendship: ${error.message}`);
  }
};

module.exports.deleteFriendship = async function ({ userId, friendId }) {
  try {
    const deletedRequest = await prisma.friendship.deleteMany({
      where: {
        OR: [
          { senderId: userId, receiverId: friendId },
          { senderId: friendId, receiverId: userId },
        ],
      },
    });

    if (deletedRequest.count === 0) {
      throw new Error('Friendship not found or already deleted');
    }

    return { message: 'Friendship deleted successfully' };
  } catch (error) {
    console.error('Error deleting friendship:', error);
    throw new Error(
      'An unexpected error occurred while deleting the friendship'
    );
  }
};
