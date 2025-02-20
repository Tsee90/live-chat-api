const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const passport = require('../config/passport-jwt');
const passportJWT = passport.authenticate('jwt', { session: false });

router.post('/', passportJWT, messageController.createMessage);
router.get('/:id', passportJWT, messageController.getMessageById);
router.get('/room/:roomId', passportJWT, messageController.getMessagesByRoom);
router.delete('/:id', passportJWT, messageController.deleteMessage);

module.exports = router;
