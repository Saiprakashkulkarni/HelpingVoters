/**
 * @fileoverview Authentication Controller
const User = require('../models/User');
const Checklist = require('../models/Checklist');
const { asyncHandler } = require('../middleware/errorHandler');
const { generateToken } = require('../middleware/authMiddleware');
const admin = require('../config/firebase');
const { firebaseInitialized } = require('../config/firebase');
const { DEFAULT_CHECKLIST } = require('../data/checklist');

/**
 * @desc    Helper to create a voter checklist for a new user
 * @param   {Object} user - User document
 * @returns {Promise<Object>} Created checklist document
 */
const createChecklist = async (user) => {
  const checklistItems = DEFAULT_CHECKLIST.map(item => ({
    ...item,
    completed: false,
  }));

  if (user.age >= 18) {
    const item = checklistItems.find(i => i.key === 'check_eligibility');
    if (item) { item.completed = true; item.completedAt = new Date(); }
  }
  if (user.voterStatus === 'registered') {
    const item = checklistItems.find(i => i.key === 'register');
    if (item) { item.completed = true; item.completedAt = new Date(); }
  }
  if (user.hasVoterId) {
    const item = checklistItems.find(i => i.key === 'get_voter_id');
    if (item) { item.completed = true; item.completedAt = new Date(); }
  }

  return Checklist.create({ userId: user._id, items: checklistItems });
};

/**
 * @desc    Helper to calculate voter readiness score
 * @param   {Object} data - User profile data
 * @returns {number} Calculated score (0-100)
 */
const calcReadinessScore = (data) => {
  let score = 0;
  if (data.voterStatus === 'registered') score += 30;
  else if (data.voterStatus === 'applied') score += 15;
  if (data.hasVoterId) score += 25;
  if (data.age >= 18) score += 10;
  if (data.pincode) score += 5;
  return score;
};

/**
 * @desc    Send authentication response with JWT token
 * @param   {Object} res - Express response object
 * @param   {Object} user - User document
 * @param   {number} [statusCode=200] - HTTP status code
 */
const sendAuthResponse = (res, user, statusCode = 200) => {
  const token = generateToken(user._id);
  const userObj = user.toObject();
  delete userObj.password;

  res.status(statusCode).json({
    success: true,
    data: { user: userObj, token },
  });
};

/**
 * @desc    Register a new user with email and password
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, error: 'Name, email, and password are required.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ success: false, error: 'Password must be at least 6 characters.' });
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(409).json({ success: false, error: 'An account with this email already exists.' });
  }

  const user = await User.create({
    name,
    email,
    password,
    authProvider: 'local',
    profileCompleted: false,
  });

  sendAuthResponse(res, user, 201);
});

/**
 * @desc    Login user with email and password
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password are required.' });
  }

  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return res.status(401).json({ success: false, error: 'Invalid email or password.' });
  }

  if (user.authProvider === 'google' && !user.password) {
    return res.status(401).json({
      success: false,
      error: 'This account uses Google Sign-In. Please sign in with Google.',
    });
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({ success: false, error: 'Invalid email or password.' });
  }

  sendAuthResponse(res, user);
});

/**
 * @desc    Authenticate with Firebase Google ID token
 * @route   POST /api/auth/google
 * @access  Public
 */
const googleAuth = asyncHandler(async (req, res) => {
  // Check if Firebase Admin is properly configured
  if (!firebaseInitialized) {
    return res.status(503).json({
      success: false,
      error: 'Google Sign-In is not available. Firebase Admin SDK is not configured on the server. Please use email/password authentication.',
    });
  }

  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ success: false, error: 'Firebase ID token is required.' });
  }

  let decodedToken;
  try {
    decodedToken = await admin.auth().verifyIdToken(idToken);
  } catch (error) {
    console.error('Firebase token verification failed:', error.message);
    return res.status(401).json({ success: false, error: 'Invalid or expired Firebase token.' });
  }

  const { uid, email, name, picture } = decodedToken;

  // Check if user exists by firebase UID or email
  let user = await User.findOne({ $or: [{ googleId: uid }, { email }] });

  if (user) {
    // Update Google info if needed
    if (!user.googleId) user.googleId = uid;
    if (!user.avatar && picture) user.avatar = picture;
    if (user.authProvider === 'local') user.authProvider = 'google';
    await user.save();
  } else {
    // Create new user
    user = await User.create({
      name: name || email.split('@')[0],
      email,
      googleId: uid,
      authProvider: 'google',
      avatar: picture || '',
      profileCompleted: false,
    });
  }

  sendAuthResponse(res, user, user.isNew ? 201 : 200);
});

/**
 * @desc    Complete user profile after registration
 * @route   PUT /api/auth/complete-profile
 * @access  Private
 */
const completeProfile = asyncHandler(async (req, res) => {
  const { age, state, constituency, voterStatus, hasVoterId, isFirstTimeVoter, pincode } = req.body;

  if (!age || !state) {
    return res.status(400).json({ success: false, error: 'Age and state are required.' });
  }

  if (age < 17) {
    return res.status(400).json({ success: false, error: 'You must be at least 17 years old.' });
  }

  const user = req.user;
  user.age = age;
  user.state = state;
  user.constituency = constituency || '';
  user.voterStatus = voterStatus || 'unknown';
  user.hasVoterId = hasVoterId || false;
  user.isFirstTimeVoter = isFirstTimeVoter !== undefined ? isFirstTimeVoter : (age <= 21);
  user.pincode = pincode || '';
  user.readinessScore = calcReadinessScore(user);
  user.profileCompleted = true;
  await user.save();

  let checklist = await Checklist.findOne({ userId: user._id });
  if (!checklist) {
    checklist = await createChecklist(user);
  }

  const token = generateToken(user._id);
  res.json({
    success: true,
    data: { user, checklist, token },
  });
});

/**
 * @desc    Get current logged-in user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = asyncHandler(async (req, res) => {
  const checklist = await Checklist.findOne({ userId: req.user._id });
  res.json({
    success: true,
    data: { user: req.user, checklist },
  });
});
/**
 * @desc    Update user profile fields
 * @route   PUT /api/auth/update-profile
 * @access  Private
 */
const updateProfile = asyncHandler(async (req, res) => {
  const user = req.user;
  const { name, age, state, pincode, voterStatus, hasVoterId, isFirstTimeVoter } = req.body;

  if (name !== undefined) user.name = name;
  if (age !== undefined) user.age = parseInt(age);
  if (state !== undefined) user.state = state;
  if (pincode !== undefined) user.pincode = pincode;
  if (voterStatus !== undefined) user.voterStatus = voterStatus;
  if (hasVoterId !== undefined) user.hasVoterId = hasVoterId;
  if (isFirstTimeVoter !== undefined) user.isFirstTimeVoter = isFirstTimeVoter;

  user.readinessScore = calcReadinessScore(user);
  await user.save();

  const userObj = user.toObject();
  delete userObj.password;

  res.json({ success: true, data: { user: userObj } });
});

module.exports = { register, login, googleAuth, completeProfile, getMe, updateProfile };
