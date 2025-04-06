const { body } = require('express-validator');
const db = require('../queries/userQueries'); // Your DB queries file

const validateUser = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 3, max: 15 })
    .withMessage('Username must be between 3 and 15 characters')
    .matches(/^(?!.*[_.-]{2})[A-Za-z0-9][A-Za-z0-9_.-]*[A-Za-z0-9]$/)
    .withMessage(
      'Username can only contain letters, numbers, underscores (_), hyphens (-), and periods (.), and cannot start or end with a special character or have duplicates.'
    )
    .custom(async (username) => {
      const existingUser = await db.getUserByName(username);
      if (existingUser) {
        throw new Error('Username is already taken');
      }
    }),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format')
    .isLength({ min: 6, max: 254 })
    .withMessage('Email must be within 6 to 254 characters')
    .custom(async (email) => {
      const existingEmail = await db.getUserByEmail(email);
      if (existingEmail) {
        throw new Error('Email is already registered');
      }
    }),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters')
    .matches(/[A-Z]/)
    .withMessage('Must include one uppercase letter')
    .matches(/\d/)
    .withMessage('Must include one number')
    .matches(/[@$!%*?&]/)
    .withMessage('Must include one special character'),

  body('confirmPassword')
    .notEmpty()
    .withMessage('Confirm Password is required')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
];
const validateMessage = [
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Message content is required')
    .isLength({ max: 2000 })
    .withMessage('Message must not exceed 2000 characters'),
];
module.exports = { validateUser, validateMessage };
