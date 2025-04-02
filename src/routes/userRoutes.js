const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const passport = require('../config/passport-jwt');
const passportJWT = passport.authenticate('jwt', { session: false });
const cors = require('cors');

router.post('/signup', userController.createUser);
router.post('/login', userController.login);
router.post('/verify-email', userController.verifyEmail);
router.post(
  '/resend-email-verification',
  userController.resendEmailVerification
);
router.post('/guest', cors(), userController.createGuest);
//router.post('/create-admin', userController.createUserByAdmin);

router.get('/:id', passportJWT, userController.getUserById);
router.put('/:id', passportJWT, userController.updateUser);
router.delete('/:id', passportJWT, userController.deleteUser);
//router.get('/', passportJWT, userController.getAllUsers);

module.exports = router;
