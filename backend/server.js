const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

const connectDB = require('./src/config/db');
const authRoutes = require('./src/routes/authRoutes');
const serviceRoutes = require('./src/routes/serviceRoutes');
const addressRoutes = require('./src/routes/addressRoutes');
const providerRoutes = require('./src/routes/providerRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const bookingRoutes = require('./src/routes/bookingRoutes');
const reviewRoutes = require('./src/routes/reviewRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');
const errorMiddleware = require('./src/middleware/errorMiddleware');
const AppError = require('./src/utils/appError');
const { initSocket } = require('./src/socket/socketHandler');

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

// 1) GLOBAL MIDDLEWARES

// Set security HTTP headers
app.use(helmet());

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} request to ${req.originalUrl}`);
    next();
  });
}

// Limit requests from same API
const limiter = rateLimit({
  max: 1000, // Limit each IP to 1000 requests per 15 minutes in local dev
  windowMs: 15 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in 15 minutes!'
});
app.use('/api', limiter);

// CORS setup
const allowedOrigins = ['http://localhost:5173', 'http://localhost:3000'];
if (process.env.FRONTEND_URL) {
  const cleanUrl = process.env.FRONTEND_URL.trim().replace(/\/$/, '');
  if (!allowedOrigins.includes(cleanUrl)) allowedOrigins.push(cleanUrl);
  const withSlash = cleanUrl + '/';
  if (!allowedOrigins.includes(withSlash)) allowedOrigins.push(withSlash);
}

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// 2) ROUTES
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/services', serviceRoutes);
app.use('/api/v1/addresses', addressRoutes);
app.use('/api/v1/providers', providerRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/notifications', notificationRoutes);

// Health check endpoint
app.use('/api/v1/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'ServeConnect API is healthy and running!',
    timestamp: new Date()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Welcome to the ServeConnect API server! Everything is working correctly.',
    health: '/api/v1/health'
  });
});

// Handle undefined routes
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global error handling middleware
app.use(errorMiddleware);

// 3) START SERVER
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Connect to database
  await connectDB();

  server.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
};

startServer();

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
