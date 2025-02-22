const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const messageRoutes = require('./messageRoutes');
const passport = require('../config/passport-jwt');
const passportJWT = passport.authenticate('jwt', { session: false });

router.post('/', passportJWT, roomController.createRoom);
router.get('/:roomId', passportJWT, roomController.getRoomById);
router.put('/:roomId', passportJWT, roomController.updateRoom);
router.delete('/:roomId', passportJWT, roomController.deleteRoom);
router.get('/', passportJWT, roomController.getNearbyRooms);
router.post('/:roomId/join', passportJWT, roomController.joinRoom);
router.post('/:roomId/leave', passportJWT, roomController.leaveRoom);

router.use('/:roomId/messages', messageRoutes);

module.exports = router;
