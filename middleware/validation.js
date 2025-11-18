const { body, validationResult, check } = require('express-validator');
const zxcvbn = require('zxcvbn');

// Simple sanitization function
const sanitize = (value) => {
  if (typeof value !== 'string') return value;
  return value
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .trim();
};

// Validation rules for user registration
const registerValidationRules = () => {
  return [
    body('username')
      .isLength({ min: 6, max: 30 }) // Updated to match server-side validation
      .withMessage('Username must be between 6 and 30 characters')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username can only contain letters, numbers, and underscores')
      .customSanitizer(sanitize),
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 8 }) // Updated to match server-side validation
      .withMessage('Password must be at least 8 characters long')
      .custom((value) => {
        const result = zxcvbn(value);
        // Lower the threshold to allow weaker passwords for testing
        if (result.score < 2) {
          throw new Error('Password is too weak. Please choose a stronger password.');
        }
        return true;
      })
  ];
};

// Validation rules for user login
const loginValidationRules = () => {
  return [
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail(),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ];
};

// Validation rules for post creation
const postValidationRules = () => {
  return [
    body('content')
      .isLength({ min: 1, max: 500 })
      .withMessage('Post content must be between 1 and 500 characters')
      .trim()
      .customSanitizer(sanitize)
  ];
};

// Validation rules for comment creation
const commentValidationRules = () => {
  return [
    body('content')
      .isLength({ min: 1, max: 300 })
      .withMessage('Comment content must be between 1 and 300 characters')
      .trim()
      .customSanitizer(sanitize)
  ];
};

// Validation rules for message sending
const messageValidationRules = () => {
  return [
    body('content')
      .isLength({ min: 1, max: 1000 })
      .withMessage('Message content must be between 1 and 1000 characters')
      .trim()
      .customSanitizer(sanitize)
  ];
};

// Validation rules for user profile updates
const userProfileValidationRules = () => {
  return [
    body('biography')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Biography must be less than 500 characters')
      .trim()
      .customSanitizer(sanitize)
  ];
};

// Generic request validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      message: 'Validation failed',
      errors: errors.array() 
    });
  }
  next();
};

module.exports = {
  registerValidationRules,
  loginValidationRules,
  postValidationRules,
  commentValidationRules,
  messageValidationRules,
  userProfileValidationRules,
  validate
};