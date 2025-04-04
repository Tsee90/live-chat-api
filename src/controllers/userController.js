const db = require('../queries/userQueries');
const passportLocal = require('../config/passport-local');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validateUser } = require('../config/validators');
const { validationResult } = require('express-validator');
const { sendVerificationEmail } = require('../config/sendVerifier');

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
        await sendVerificationEmail({
          type: 'email',
          to: req.body.email,
          code: verificationCode,
        });
      }
      const { username, email } = newUser;
      res.status(201).json({ username, email });
    } catch (error) {
      res.status(400).json(error);
    }
  },
];

module.exports.createGuest = async (req, res) => {
  const generateGuestName = () => {
    const randomValue = Math.floor(Math.random() * 1e8); // Generate a random number (e.g., up to 100 million)
    return `Guest-${randomValue.toString(36).slice(0, 6)}`; // Convert to base-36 and slice for shorter length
  };
  let username;
  let validName = false;

  while (!validName) {
    username = generateGuestName();
    const existingUser = await db.getUserByName(username);

    if (!existingUser) {
      validName = true;
    }
  }
  const password = (Math.floor(Math.random() * 90000000) + 10000000).toString();

  const email = username + '@chizmiz.live';
  const role = 'guest';
  const emailVerified = true;

  try {
    const user = await db.createUser({
      username,
      password,
      email,
      role,
      emailVerified,
    });
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      {
        expiresIn: '12h',
      }
    );
    return res.json({ token, user });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: 'Something went wrong' });
  }
};

module.exports.passwordResetRequest = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await db.getUserByEmail(email);

    if (user) {
      const resetCode = crypto.randomUUID();
      user.resetCode = resetCode;
      await db.updateUser(user);
      await sendVerificationEmail({
        type: 'password',
        to: email,
        code: resetCode,
      });
      return res.status(200).json({ message: 'Password reset request sent' });
    } else {
      return res.status(400).json({ message: 'Invalid email' });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'Oops. Something went wrong!' });
  }
};

module.exports.passwordReset = async (req, res) => {
  const { code } = req.params;
  const { email, newPassword } = req.body;
  const password = await bcrypt.hash(newPassword, 10);
  const user = await db.getUserByEmail(email);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (!user.resetCode) {
    return res.status(400).json({ message: 'No reset request found' });
  }

  if (user.resetCode !== code) {
    return res.status(400).json({ message: 'Invalid reset code' });
  }
  try {
    user.password = password;
    user.resetCode = null;
    const updatedUser = await db.updateUser(user);
    console.log(updatedUser);
    return res.status(200).json({ message: 'Password updated' });
  } catch (error) {
    return res.status(500).json({ message: 'Something went wrong' });
  }
};

module.exports.getUsername = async (req, res) => {
  const { email } = req.query;

  try {
    const user = await db.getUserByEmail(email);

    if (!user) return res.status(404).json({ message: 'User not found' });
    sendVerificationEmail({ type: 'username', to: email, code: user.username });
    return res.status(200).json({ message: 'Username sent to email' });
  } catch (error) {
    return res.status(500).json({ message: 'Something went wrong' });
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
  if (req.user.id !== req.params.id)
    res.status(400).json({ error: 'Unauthorized deletion' });
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
      { id: user.id, username: user.username, role: user.role },
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
        await sendVerificationEmail({
          type: 'email',
          to: req.body.email,
          code: verificationCode,
        });
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
