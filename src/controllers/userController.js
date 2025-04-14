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
      const { username, email, password } = req.body;
      if (!username || !email || !password)
        return res.status(400).json('Missing input fields');
      const encryptedPassword = await bcrypt.hash(password, 10);
      const verificationCode = Math.floor(
        100000 + Math.random() * 900000
      ).toString();
      await db.createUser({
        username,
        email,
        password: encryptedPassword,
        verificationCode,
      });
      await sendVerificationEmail({
        type: 'email',
        to: email,
        code: verificationCode,
      });

      res.status(201).json({ username, email });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: 'An unexpected error occured' });
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
      {
        id: user.id,
        username: user.username,
        role: user.role,
        email: user.email,
      },
      process.env.JWT_SECRET
    );
    return res.status(201).json({ token });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: 'An unexpected error occured' });
  }
};

module.exports.passwordResetRequest = async (req, res) => {
  try {
    const { email, token } = req.body;
    if (!email) return res.status(400).json({ message: 'Missing email field' });

    const user = await db.getUserByEmail(email);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const resetCode = crypto.randomUUID();
    user.resetCode = resetCode;
    await db.updateUser(user);
    if (token) return res.status(200).json({ resetCode });
    sendVerificationEmail({
      type: 'password',
      to: email,
      code: resetCode,
    });

    return res.status(200).json({ message: 'Password reset request sent' });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'An unexpected error occured' });
  }
};

module.exports.passwordReset = async (req, res) => {
  try {
    const { code } = req.params;
    const { email, newPassword } = req.body;
    if (!code) return res.status(401).json({ message: 'Unauthorized reset' });
    if (!email || !newPassword)
      return res.status(400).json({ message: 'Missing fields' });
    const password = await bcrypt.hash(newPassword, 10);
    const user = await db.getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.resetCode) {
      return res.status(400).json({ message: 'No reset request found' });
    }

    if (user.resetCode !== code) {
      return res.status(401).json({ message: 'Unauthorized reset' });
    }
    user.password = password;
    user.resetCode = null;
    await db.updateUser(user);
    return res.status(204).json({ message: 'Password updated' });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'An unexpected error occured' });
  }
};

module.exports.getUsername = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ message: 'Missing email field' });
    }
    const user = await db.getUserByEmail(email);

    if (!user) return res.status(404).json({ message: 'Email not found' });
    sendVerificationEmail({ type: 'username', to: email, code: user.username });
    return res.status(200).json({ message: 'Username sent to email' });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'An unexpected error occured' });
  }
};

module.exports.getUserById = async (req, res) => {
  try {
    const user = await db.getUserById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.status(200).json(user);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'An unexpected error occured' });
  }
};

module.exports.getUserByUsername = async (req, res) => {
  try {
    const { username } = req.params;
    if (!username)
      return res.status(400).json({ message: 'Missing username field' });
    const user = await db.getUserByName(username);
    res.status(200).json({ user });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'An unexpected error occurred' });
  }
};

module.exports.updateUser = async (req, res) => {
  try {
    if (!req.params.id)
      return res.status(400).json({ message: 'Missing param field: id' });
    if (!req.body) return res.status(400).json({ message: 'Missing fields' });
    await db.updateUser(req.params.id, req.body);
    res.status(204).json({ message: 'User updated' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'An unexpected error occured' });
  }
};

module.exports.deleteUser = async (req, res) => {
  if (!req.params.id)
    return res.status(400).json({ message: 'Missing param field: id' });
  if (req.user.id !== req.params.id)
    res.status(400).json({ error: 'Unauthorized deletion' });
  try {
    const deletedUser = await db.deleteUser(req.params.id);
    res.status(204).json({ message: 'User deleted' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'An unexpected error occured' });
  }
};

module.exports.getAllUsers = async (req, res) => {
  try {
    const users = await db.getAllUsers();
    res.json(users);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'An unexpected error occured' });
  }
};

module.exports.login = async (req, res, next) => {
  passportLocal.authenticate('local', { session: false }, (err, user, info) => {
    try {
      if (err || !user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      if (!user.emailVerified) {
        return res.status(401).json({ message: 'Email not verified' });
      }

      const token = jwt.sign(
        {
          id: user.id,
          username: user.username,
          role: user.role,
          email: user.email,
        },
        process.env.JWT_SECRET
      );
      return res.status(200).json({ token });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: 'An unexpected error occured' });
    }
  })(req, res, next);
};

module.exports.verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code)
      return res.status(400).json({ message: 'Missing fields' });
    const user = await db.getUserByEmail(email);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.emailVerified) {
      return res.status(403).json({ message: 'User already verified' });
    }

    if (user.verificationCode !== code) {
      return res.status(401).json({ message: 'Invalid verification code' });
    }
    const userId = user.id;

    await db.verifyUser(userId);
    res.status(200).json({ message: 'Email verified successfully' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'An unexpected error occured' });
  }
};

module.exports.resendEmailVerification = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Missing field' });
    const user = await db.getUserByEmail(email);
    if (!user) return res.status(404).json({ message: 'Email not found' });
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
    res.status(200).json({ message: 'Verification resent' });
  } catch (error) {
    console.log(error);
    res.status(400).json('An unexpected error occured');
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
