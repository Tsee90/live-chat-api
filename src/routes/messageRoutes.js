const express = require('express');
const router = express.Router({ mergeParams: true });
const messageController = require('../controllers/messageController');
const passport = require('../config/passport-jwt');
const passportJWT = passport.authenticate('jwt', { session: false });

router.post('/', passportJWT, messageController.createMessage);
router.get('/', passportJWT, messageController.getMessagesByRoom);

router.get('/:messageId', passportJWT, messageController.getMessageById);
//router.delete('/:messageId', passportJWT, messageController.deleteMessage);

module.exports = router;
