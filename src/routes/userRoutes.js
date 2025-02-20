const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const passport = require('../config/passport-jwt');
const passportJWT = passport.authenticate('jwt', { session: false });

router.post('/', userController.createUser);
router.post('/login', userController.login);

router.get('/:id', passportJWT, userController.getUserById);
router.put('/:id', passportJWT, userController.updateUser);
router.delete('/:id', passportJWT, userController.deleteUser);
router.get('/', passportJWT, userController.getAllUsers);

module.exports = router;
