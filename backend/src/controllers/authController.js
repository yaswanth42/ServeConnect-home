const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ProviderProfile = require('../models/ProviderProfile');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

const signToken = (id, secret, expires) => {
  return jwt.sign({ id }, secret, {
    expiresIn: expires
  });
};

const createSendToken = async (user, statusCode, res) => {
  const accessToken = signToken(
    user._id,
    process.env.JWT_SECRET,
    process.env.JWT_EXPIRES_IN
  );
  
  const refreshToken = signToken(
    user._id,
    process.env.JWT_REFRESH_SECRET,
    process.env.JWT_REFRESH_EXPIRES_IN
  );

  // Save refresh token to user in database
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  // Options for cookies
  const isSecure = process.env.NODE_ENV === 'production' || (process.env.FRONTEND_URL && process.env.FRONTEND_URL.startsWith('https'));
  const cookieOptions = {
    expires: new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days matching refresh token
    ),
    httpOnly: true,
    secure: isSecure,
    sameSite: isSecure ? 'none' : 'lax'
  };

  res.cookie('refreshToken', refreshToken, cookieOptions);

  // Remove password from output
  user.password = undefined;
  user.refreshToken = undefined;

  res.status(statusCode).json({
    status: 'success',
    token: accessToken,
    data: {
      user
    }
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const { name, email, password, role, category, experience, bio } = req.body;

  // Create User
  const newUser = await User.create({
    name,
    email,
    password,
    role
  });

  // If user is a provider, create the ProviderProfile
  if (role === 'provider') {
    const profile = await ProviderProfile.create({
      user: newUser._id,
      category,
      experience,
      bio
    });
    
    // Link profile to user
    newUser.providerProfile = profile._id;
    await newUser.save({ validateBeforeSave: false });
  }

  // Populate provider profile if exists
  const populatedUser = await User.findById(newUser._id).populate({
    path: 'providerProfile',
    populate: { path: 'category', select: 'name slug' }
  });

  await createSendToken(populatedUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }

  // 2) Check if user exists && password is correct
  const user = await User.findOne({ email }).select('+password').populate({
    path: 'providerProfile',
    populate: { path: 'category', select: 'name slug' }
  });

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // 3) If everything ok, send token to client
  await createSendToken(user, 200, res);
});

exports.logout = catchAsync(async (req, res, next) => {
  const { refreshToken } = req.cookies;

  if (refreshToken) {
    // Revoke from database
    await User.findOneAndUpdate({ refreshToken }, { $unset: { refreshToken: 1 } });
  }

  const isSecure = process.env.NODE_ENV === 'production' || (process.env.FRONTEND_URL && process.env.FRONTEND_URL.startsWith('https'));
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: isSecure,
    sameSite: isSecure ? 'none' : 'lax'
  });

  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully'
  });
});

exports.refresh = catchAsync(async (req, res, next) => {
  const { refreshToken } = req.cookies;

  if (!refreshToken) {
    return next(new AppError('No refresh token provided', 401));
  }

  // Verify token
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch (err) {
    return next(new AppError('Invalid or expired refresh token', 401));
  }

  // Check if user still exists
  const currentUser = await User.findOne({ _id: decoded.id, refreshToken }).populate({
    path: 'providerProfile',
    populate: { path: 'category', select: 'name slug' }
  });

  if (!currentUser) {
    return next(new AppError('The user belonging to this token no longer exists or token has been revoked.', 401));
  }

  // Sign new access token
  const accessToken = signToken(
    currentUser._id,
    process.env.JWT_SECRET,
    process.env.JWT_EXPIRES_IN
  );

  currentUser.password = undefined;

  res.status(200).json({
    status: 'success',
    token: accessToken,
    data: {
      user: currentUser
    }
  });
});

// Protect routes middleware
exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check if it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access.', 401)
    );
  }

  // 2) Verification token
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  // 3) Check if user still exists
  const currentUser = await User.findById(decoded.id).populate({
    path: 'providerProfile',
    populate: { path: 'category', select: 'name slug' }
  });
  if (!currentUser) {
    return next(
      new AppError(
        'The user belonging to this token no longer exists.',
        401
      )
    );
  }

  // 4) Check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please log in again.', 401)
    );
  }

  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  next();
});

// Restrict routes middleware
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles ['admin', 'provider', 'customer']
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with that email address.', 404));
  }

  // 2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3) Log details for local testing (mocking SMTP)
  const cleanFrontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').trim().replace(/\/$/, '');
  const resetURL = `${cleanFrontendUrl}/reset-password/${resetToken}`;
  
  console.log('--- PASSWORD RESET SYSTEM LOG ---');
  console.log(`To: ${user.email}`);
  console.log(`Subject: ServeConnect Password Reset Link (Valid for 10 min)`);
  console.log(`URL: ${resetURL}`);
  console.log('---------------------------------');

  res.status(200).json({
    status: 'success',
    message: 'Token sent to email! (Checked console logs in development mode)',
    // In dev mode we also return it in body to make automated/manual testing super easy without reading console logs!
    resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
  });
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  // 2) If token has not expired, and there is user, set the new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }
  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // 3) Log in the user, send JWT
  await createSendToken(user, 200, res);
});
