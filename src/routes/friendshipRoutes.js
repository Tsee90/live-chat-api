const express = require('express');
const router = express.Router();
const friendshipController = require('../controllers/friendshipController');
const passport = require('../config/passport-jwt');
const passportJWT = passport.authenticate('jwt', { session: false });

// Create a friend request
router.post(
  '/friend-request',
  passportJWT,
  friendshipController.createFriendRequest
);

// Get all friends of a user
router.get('/:id/friends', passportJWT, friendshipController.getUserFriends);

// Get all pending friend requests for a user
router.get(
  '/:id/pending-requests',
  passportJWT,
  friendshipController.getPendingFriendRequests
);

// Accept a friend request
router.put(
  '/friend-request/:senderId/accept',
  passportJWT,
  friendshipController.acceptFriendRequest
);

// Decline a friend request
router.put(
  '/friend-request/:senderId/decline',
  passportJWT,
  friendshipController.declineFriendRequest
);

// Cancel a sent friend request
router.delete(
  '/friend-request/:receiverId/cancel',
  passportJWT,
  friendshipController.cancelFriendRequest
);

// Unfriend a user
router.delete(
  '/friend/:userId',
  passportJWT,
  friendshipController.unfriendUser
);

// Check if users are friends
router.get(
  '/:userId1/is-friend/:userId2',
  passportJWT,
  friendshipController.areUsersFriends
);

// Get all friend requests sent by a user
router.get(
  '/:id/sent-requests',
  passportJWT,
  friendshipController.getSentFriendRequests
);

// Get all friend requests received by a user
router.get(
  '/:id/received-requests',
  passportJWT,
  friendshipController.getReceivedFriendRequests
);

module.exports = router;
