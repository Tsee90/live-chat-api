const db = require('../queries/friendshipQueries'); // This will contain Prisma queries related to friendship
const userdb = require('../queries/userQueries'); // User queries

module.exports.createFriendRequest = async (req, res) => {
  try {
    const senderId = req.user.id; // Use the authenticated user's ID
    const { receiverId } = req.body;

    if (!receiverId) {
      return res.status(400).json({ message: 'Receiver ID is required' });
    }

    // Check if the receiver exists
    const receiver = await userdb.getUserById(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: 'Receiver not found' });
    }

    // Prevent sending a request to yourself
    if (senderId === receiverId) {
      return res
        .status(400)
        .json({ message: 'Cannot send a friend request to yourself' });
    }

    // Check if the request already exists
    const existingRequest = await db.getFriendRequest({
      userId1: senderId,
      userId2: receiverId,
    });
    if (existingRequest) {
      return res.status(400).json({ message: 'Friend request already sent' });
    }

    await db.createFriendRequest({ senderId, receiverId });
    res.status(201).json({ message: 'Friend request sent successfully' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'An unexpected error occurred' });
  }
};

module.exports.acceptFriendRequest = async (req, res) => {
  try {
    const receiverId = req.user.id; // Use the authenticated user's ID
    const { senderId } = req.body;

    if (!senderId) {
      return res.status(400).json({ message: 'Receiver ID is required' });
    }

    // Accept the request
    await db.acceptFriendRequest({ senderId, receiverId });
    res.status(200).json({ message: 'Friend request accepted' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'An unexpected error occurred' });
  }
};

module.exports.declineFriendRequest = async (req, res) => {
  try {
    const receiverId = req.user.id; // Use the authenticated user's ID
    const { senderId } = req.body;

    if (!senderId) {
      return res.status(400).json({ message: 'Receiver ID is required' });
    }

    // Decline the request
    await db.declineFriendRequest({ senderId, receiverId });
    res.status(200).json({ message: 'Friend request declined' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'An unexpected error occurred' });
  }
};

module.exports.cancelFriendRequest = async (req, res) => {
  try {
    const senderId = req.user.id; // Use the authenticated user's ID
    const { receiverId } = req.body;

    if (!receiverId) {
      return res.status(400).json({ message: 'Receiver ID is required' });
    }

    // Cancel the request
    await db.cancelFriendRequest({ senderId, receiverId });
    res.status(200).json({ message: 'Friend request canceled' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'An unexpected error occurred' });
  }
};

module.exports.unfriendUser = async (req, res) => {
  try {
    const userId = req.user.id; // Use the authenticated user's ID
    const { friendId } = req.body;

    if (!friendId) {
      return res.status(400).json({ message: 'Friend ID is required' });
    }

    // Unfriend the user
    await db.unfriendUser({ userId, friendId });
    res.status(200).json({ message: 'User unfriended successfully' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'An unexpected error occurred' });
  }
};

module.exports.getUserFriends = async (req, res) => {
  try {
    const userId = req.user.id; // Use the authenticated user's ID

    const friends = await db.getUserFriends(userId);
    res.status(200).json(friends);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'An unexpected error occurred' });
  }
};

module.exports.getPendingFriendRequests = async (req, res) => {
  try {
    const userId = req.user.id; // Use the authenticated user's ID

    const requests = await db.getPendingFriendRequests(userId);
    res.status(200).json(requests);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'An unexpected error occurred' });
  }
};

module.exports.getFriendRequest = async (req, res) => {
  try {
    const userId1 = req.user.id; // Use the authenticated user's ID
    const { userId2 } = req.params;

    if (!userId1 || !userId2)
      return res.status(400).json({ message: 'Missing Fields' });

    const existingRequest = await db.getFriendRequest({ userId1, userId2 });
    if (!existingRequest)
      return res.status(204).json({ message: 'No request found' });
    return res.status(200).json({ message: 'Request found' });
  } catch (error) {
    console.log(error);
  }
  res.status(500).json({ message: 'An unexpected error occurred' });
};

module.exports.areUsersFriends = async (req, res) => {
  try {
    const userId1 = req.user.id; // Use the authenticated user's ID
    const { userId2 } = req.params;

    if (!userId2) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const areFriends = await db.areUsersFriends({ userId1, userId2 });
    res.status(200).json({ areFriends });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'An unexpected error occurred' });
  }
};

module.exports.getSentFriendRequests = async (req, res) => {
  try {
    const userId = req.user.id; // Use the authenticated user's ID

    const requests = await db.getSentFriendRequests(userId);
    res.status(200).json(requests);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'An unexpected error occurred' });
  }
};

module.exports.getReceivedFriendRequests = async (req, res) => {
  try {
    const userId = req.user.id; // Use the authenticated user's ID

    const requests = await db.getReceivedFriendRequests(userId);
    res.status(200).json(requests);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'An unexpected error occurred' });
  }
};

module.exports.deleteFriendship = async (req, res) => {
  try {
    const userId = req.user.id;
    const { friendId } = req.body;

    if (!userId || !friendId)
      return res.status(400).json({ message: 'Missing fields' });

    await db.deleteFriendship({ userId, friendId });
    res.status(200).json({ message: 'Friendship deleted' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'An unexpected error occurred' });
  }
};
