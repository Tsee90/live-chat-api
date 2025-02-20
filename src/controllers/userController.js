const db = require('../queries/userQueries');
const passportLocal = require('../config/passport-local');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

module.exports.createUser = async (req, res) => {
  try {
    console.log('creating user...');
    req.body.password = await bcrypt.hash(req.body.password, 10);
    const newUser = await db.createUser(req.body);
    res.status(201).json(newUser);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports.getUserById = async (req, res) => {
  try {
    const foundUser = await db.getUserById(req.params.id);
    if (!foundUser) return res.status(404).json({ error: 'User not found' });
    res.json(foundUser);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports.updateUser = async (req, res) => {
  try {
    const updatedUser = await db.updateUser(req.params.id, req.body);
    res.json(updatedUser);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports.deleteUser = async (req, res) => {
  try {
    await db.deleteUser(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports.getAllUsers = async (req, res) => {
  try {
    const users = await db.getAllUsers();
    res.json(users);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports.login = async (req, res, next) => {
  console.log('logging in...');
  passportLocal.authenticate('local', { session: false }, (err, user, info) => {
    if (err || !user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: '12h',
    });
    return res.json({ token, user });
  })(req, res, next);
};
