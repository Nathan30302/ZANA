const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Verify JWT token middleware
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'No token provided'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'No token provided'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database to ensure they still exist and are active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'Invalid token or user not found'
      });
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Access denied',
        message: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Access denied',
        message: 'Token has expired'
      });
    }

    console.error('Auth middleware error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Authentication failed'
    });
  }
};

// Check if user has specific role
const requireRole = (roles) => {
  return async (req, res, next) => {
    try {
      // Ensure user is authenticated first
      if (!req.user) {
        return res.status(401).json({
          error: 'Access denied',
          message: 'Authentication required'
        });
      }

      // Convert single role to array for consistent handling
      const requiredRoles = Array.isArray(roles) ? roles : [roles];
      
      // Check if user has required role
      if (!requiredRoles.includes(req.user.role)) {
        return res.status(403).json({
          error: 'Forbidden',
          message: `Access denied. Required roles: ${requiredRoles.join(', ')}`
        });
      }

      next();
    } catch (error) {
      console.error('Role check error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Authorization failed'
      });
    }
  };
};

// Optional authentication (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continue without authentication
    }

    const token = authHeader.substring(7);
    
    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (user && user.isActive) {
      req.user = user;
    }

    next();
  } catch (error) {
    // For optional auth, we don't fail on invalid tokens
    // Just continue without authentication
    next();
  }
};

module.exports = {
  verifyToken,
  requireRole,
  optionalAuth
};