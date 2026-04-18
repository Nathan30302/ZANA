const { z } = require('zod');

// Venue validation schema
const venueSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name cannot exceed 100 characters'),
  description: z.string().max(500, 'Description cannot exceed 500 characters').optional(),
  category: z.enum(['SALON', 'BARBERSHOP', 'NAIL_STUDIO', 'MAKEUP_STUDIO'], { errorMap: () => ({ message: 'Invalid category' }) }),
  phone: z.string().regex(/^[0-9]{10,15}$/, 'Invalid phone number'),
  email: z.string().email('Invalid email address').optional(),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  city: z.string().min(2, 'City name must be at least 2 characters'),
  latitude: z.number().min(-90).max(90, 'Invalid latitude'),
  longitude: z.number().min(-180).max(180, 'Invalid longitude'),
  coverPhoto: z.string().url('Invalid cover photo URL').optional(),
  photos: z.array(z.string().url('Invalid photo URL')).optional(),
  amenities: z.array(z.string()).optional()
});

// Mobile Provider validation schema
const mobileProviderSchema = z.object({
  bio: z.string().max(500, 'Bio cannot exceed 500 characters').optional(),
  portfolioPhotos: z.array(z.string().url('Invalid portfolio photo URL')).optional(),
  baseLat: z.number().min(-90).max(90, 'Invalid base latitude'),
  baseLng: z.number().min(-180).max(180, 'Invalid base longitude'),
  serviceRadius: z.number().min(1).max(100, 'Service radius must be between 1 and 100 km')
});

// Service validation schema
const serviceSchema = z.object({
  name: z.string().min(2, 'Service name must be at least 2 characters').max(100, 'Service name cannot exceed 100 characters'),
  description: z.string().max(500, 'Description cannot exceed 500 characters').optional(),
  category: z.enum(['HAIRCUT', 'HAIR_STYLING', 'BRAIDING', 'LOCS', 'WEAVE', 'BEARD_TRIM', 'SHAVE', 'NAILS', 'MAKEUP', 'EYEBROWS'], { errorMap: () => ({ message: 'Invalid service category' }) }),
  price: z.number().min(0, 'Price must be greater than 0'),
  duration: z.number().min(15, 'Duration must be at least 15 minutes').max(480, 'Duration cannot exceed 8 hours')
});

// Staff validation schema
const staffSchema = z.object({
  title: z.string().max(100, 'Title cannot exceed 100 characters').optional()
});

// User registration validation schema
const registerSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters').max(50, 'First name cannot exceed 50 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').max(50, 'Last name cannot exceed 50 characters'),
  email: z.string().email('Invalid email address').optional(),
  phone: z.string().regex(/^[0-9]{10,15}$/, 'Invalid phone number').optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['CUSTOMER', 'PROVIDER_MOBILE', 'PROVIDER_VENUE', 'STAFF', 'ADMIN'], { errorMap: () => ({ message: 'Invalid role' }) })
});

// User login validation schema
const loginSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
  phone: z.string().regex(/^[0-9]{10,15}$/, 'Invalid phone number').optional(),
  password: z.string().min(1, 'Password is required')
}).refine(
  (data) => data.email || data.phone,
  {
    message: 'Either email or phone is required',
    path: ['email']
  }
);

// Forgot password validation schema
const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
  phone: z.string().regex(/^[0-9]{10,15}$/, 'Invalid phone number').optional()
}).refine(
  (data) => data.email || data.phone,
  {
    message: 'Either email or phone is required',
    path: ['email']
  }
);

// Reset password validation schema
const resetPasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Password confirmation must be at least 6 characters')
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  }
);

// Middleware functions
const validateVenue = (req, res, next) => {
  try {
    venueSchema.parse(req.body);
    next();
  } catch (error) {
    return res.status(400).json({
      error: 'Validation failed',
      details: error.errors
    });
  }
};

const validateMobileProvider = (req, res, next) => {
  try {
    mobileProviderSchema.parse(req.body);
    next();
  } catch (error) {
    return res.status(400).json({
      error: 'Validation failed',
      details: error.errors
    });
  }
};

const validateService = (req, res, next) => {
  try {
    serviceSchema.parse(req.body);
    next();
  } catch (error) {
    return res.status(400).json({
      error: 'Validation failed',
      details: error.errors
    });
  }
};

const validateStaff = (req, res, next) => {
  try {
    staffSchema.parse(req.body);
    next();
  } catch (error) {
    return res.status(400).json({
      error: 'Validation failed',
      details: error.errors
    });
  }
};

const validateRegister = (req, res, next) => {
  try {
    registerSchema.parse(req.body);
    next();
  } catch (error) {
    return res.status(400).json({
      error: 'Validation failed',
      details: error.errors
    });
  }
};

const validateLogin = (req, res, next) => {
  try {
    loginSchema.parse(req.body);
    next();
  } catch (error) {
    return res.status(400).json({
      error: 'Validation failed',
      details: error.errors
    });
  }
};

const validateForgotPassword = (req, res, next) => {
  try {
    forgotPasswordSchema.parse(req.body);
    next();
  } catch (error) {
    return res.status(400).json({
      error: 'Validation failed',
      details: error.errors
    });
  }
};

const validateResetPassword = (req, res, next) => {
  try {
    resetPasswordSchema.parse(req.body);
    next();
  } catch (error) {
    return res.status(400).json({
      error: 'Validation failed',
      details: error.errors
    });
  }
};

module.exports = {
  validateVenue,
  validateMobileProvider,
  validateService,
  validateStaff,
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword
};