const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const passport = require('../config/passport-jwt');
const passportJWT = passport.authenticate('jwt', { session: false });

router.post('/', passportJWT, roomController.createRoom);
router.get('/:id', passportJWT, roomController.getRoomById);
router.put('/:id', passportJWT, roomController.updateRoom);
router.delete('/:id', passportJWT, roomController.deleteRoom);
router.get('/', passportJWT, roomController.getNearbyRooms);

module.exports = router;
