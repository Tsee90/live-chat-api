const { body } = require('express-validator');
const db = require('../queries/userQueries'); // Your DB queries file

const validateUser = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 3 })
    .withMessage('Username must be at least 3 characters')
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
    .custom(async (email) => {
      const existingEmail = await db.getUserByEmail(email);
      if (existingEmail) {
        throw new Error('Email is already registered');
      }
    }),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
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

module.exports = { validateUser };
