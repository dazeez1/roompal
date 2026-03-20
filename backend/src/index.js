require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const connectDatabase = require('./config/database');
const configureCloudinary = require('./config/cloudinary');
const authRoutes = require('./routes/authRoutes');
const propertyRoutes = require('./routes/propertyRoutes');
const roommateRoutes = require('./routes/roommateRoutes');
const roommateRequestRoutes = require('./routes/roommateRequestRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const messageRoutes = require('./routes/messageRoutes');
const { initializeSocket } = require('./socket/socketHandler');
const { globalErrorHandler } = require('./utils/errorHandler');

// Initialize Express app
const app = express();

// Create HTTP server
const server = http.createServer(app);

// Get CORS origin for Socket.io
const getCorsOrigin = () => {
  const frontendUrl = process.env.FRONTEND_URL || 'https://dev-sayo.github.io';
  // Remove trailing slash and path if present
  try {
    const url = new URL(frontendUrl);
    return url.origin; // Returns just the protocol + hostname + port
  } catch {
    // If not a valid URL, try to extract origin manually
    return frontendUrl.replace(/\/.*$/, ''); // Remove everything after the first /
  }
};

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: getCorsOrigin(),
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Initialize socket handler
initializeSocket(io);

// Connect to database
connectDatabase();

// Configure Cloudinary
configureCloudinary();

// Security middleware
app.use(helmet());

// CORS configuration - allow base origin (without path)
app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigin = getCorsOrigin();
      // Allow requests from the base origin (with or without path)
      if (!origin || origin.startsWith(allowedOrigin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/roommates', roommateRoutes);
app.use('/api/roommate-requests', roommateRequestRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/messages', messageRoutes);

// 404 handler
app.all('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// Global error handler (must be last)
app.use(globalErrorHandler);

// Start server
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  console.log(`📡 Socket.io initialized and ready for connections`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled Promise Rejection:', error);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

module.exports = { app, server, io };
