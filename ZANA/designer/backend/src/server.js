const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');
const venuesRoutes = require('./routes/venues');
const venueProfileRoutes = require('./routes/venue');
const mobileProviderRoutes = require('./routes/mobileProviders');
const serviceRoutes = require('./routes/services');
const staffRoutes = require('./routes/staff');
const openingHoursRoutes = require('./routes/openingHours');
const bookingRoutes = require('./routes/bookings');
const reviewRoutes = require('./routes/reviews');
const paymentRoutes = require('./routes/payments');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
});

app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://customer.zana.zm', 'https://provider.zana.zm'] 
    : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:8081'],
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/venues', venuesRoutes);
app.use('/api/v1/venue', venueProfileRoutes);
app.use('/api/v1/mobile-providers', mobileProviderRoutes);
app.use('/api/v1/services', serviceRoutes);
app.use('/api/v1/staff', staffRoutes);
app.use('/api/v1/opening-hours', openingHoursRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/admin', adminRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  // Don't send error details in production
  const errorResponse = process.env.NODE_ENV === 'production' 
    ? { error: 'Internal server error' }
    : { 
        error: err.message,
        stack: err.stack 
      };

  res.status(err.status || 500).json(errorResponse);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 ZANA Backend Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;