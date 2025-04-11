const express = require('express');
const router = express.Router();
const friendshipController = require('../controllers/friendshipController');
const passport = require('../config/passport-jwt');
const passportJWT = passport.authenticate('jwt', { session: false });

// Create a friend request
router.post('/request', passportJWT, friendshipController.createFriendRequest);

// Get all friends of a user
router.get('/', passportJWT, friendshipController.getUserFriends);

// Accept a friend request
router.put('/request', passportJWT, friendshipController.acceptFriendRequest);

// Delete a sent friend request
router.delete('/', passportJWT, friendshipController.deleteFriendship);

router.get(
  '/request/:userId2',
  passportJWT,
  friendshipController.getFriendRequest
);

// Get all friend requests sent by a user
router.get(
  '/sent-requests',
  passportJWT,
  friendshipController.getSentFriendRequests
);

// Get all friend requests received by a user
router.get(
  '/received-requests',
  passportJWT,
  friendshipController.getReceivedFriendRequests
);
// Check if users are friends
router.get(
  '/is-friend/:userId2',
  passportJWT,
  friendshipController.areUsersFriends
);

router.get(
  '/is-pending/:userId2',
  passportJWT,
  friendshipController.areUsersPending
);

module.exports = router;
