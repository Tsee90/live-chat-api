const db = require('../queries/userQueries');
const passportLocal = require('../config/passport-local');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validateUser } = require('../config/validators');
const { validationResult } = require('express-validator');
const { sendVerificationEmail } = require('../config/verifyEmail');

module.exports.createUser = [
  validateUser,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      req.body.password = await bcrypt.hash(req.body.password, 10);
      const verificationCode = Math.floor(
        100000 + Math.random() * 900000
      ).toString();
      const newUser = await db.createUser({ ...req.body, verificationCode });
      if (newUser) {
        await sendVerificationEmail(req.body.email, verificationCode);
      }
      const { username, email } = newUser;
      res.status(201).json({ username, email });
    } catch (error) {
      res.status(400).json(error);
    }
  },
];

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
  passportLocal.authenticate('local', { session: false }, (err, user, info) => {
    if (err || !user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.emailVerified) {
      return res.status(401).json({ message: 'Email not verified' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      {
        expiresIn: '12h',
      }
    );
    return res.json({ token, user });
  })(req, res, next);
};

module.exports.verifyEmail = async (req, res) => {
  const { email, code } = req.body;
  try {
    const user = await db.getUserByEmail(email);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.emailVerified) {
      return res.status(400).json({ message: 'User already verified' });
    }

    if (user.verificationCode !== code) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }
    const userId = user.id;

    await db.verifyUser(userId);
    res.status(200).json({ message: 'Email verified successfully!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports.resendEmailVerification = async (req, res) => {
  const { email } = req.body;
  const user = await db.getUserByEmail(email);

  if (!user.emailVerified) {
    try {
      const verificationCode = Math.floor(
        100000 + Math.random() * 900000
      ).toString();
      const updatedUser = await db.updateUser({ ...user, verificationCode });
      if (updatedUser) {
        await sendVerificationEmail(req.body.email, verificationCode);
      }
      res.status(200).json('Verification resent');
    } catch (error) {
      res.status(400).json('Something has gone wrong');
    }
  } else {
    return res.status(400).json({ message: 'User already verified' });
  }
};

/* module.exports.createUserByAdmin = async (req, res) => {
  const { username, email } = req.body;
  const password = await bcrypt.hash('123', 10);
  try {
    const user = await db.createUser({
      username,
      email,
      password,
      emailVerified: true,
    });
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json(error);
  }
}; */
