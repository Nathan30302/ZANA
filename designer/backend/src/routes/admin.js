const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { verifyToken, requireRole } = require('../middleware/auth');
const emailService = require('../services/emailService');

const prisma = new PrismaClient();
const router = express.Router();

async function loadPendingQueue(req, res) {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [pendingVenues, totalVenues] = await Promise.all([
      prisma.venue.findMany({
        where: { status: 'PENDING' },
        include: {
          owner: {
            select: { id: true, firstName: true, lastName: true, email: true, phone: true }
          },
          services: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take
      }),
      prisma.venue.count({ where: { status: 'PENDING' } })
    ]);

    const [pendingMobileProviders, totalMobile] = await Promise.all([
      prisma.mobileProvider.findMany({
        where: { status: 'PENDING' },
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true, phone: true }
          },
          services: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take
      }),
      prisma.mobileProvider.count({ where: { status: 'PENDING' } })
    ]);

    const totalPages = Math.ceil(Math.max(totalVenues, totalMobile) / parseInt(limit));

    res.json({
      data: {
        pendingVenues,
        pendingMobileProviders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalVenues,
          totalMobile,
          totalPages
        }
      }
    });
  } catch (error) {
    console.error('Admin queue error:', error);
    res.status(500).json({ error: 'Failed to load admin queue' });
  }
}

// GET /admin/pending — spec; same as /queue
router.get('/pending', verifyToken, requireRole(['ADMIN']), loadPendingQueue);

// GET /admin/queue
router.get('/queue', verifyToken, requireRole(['ADMIN']), loadPendingQueue);

// GET /admin/users
router.get('/users', verifyToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);
    const where = {
      ...(role && { role: String(role) }),
      ...(search && {
        OR: [
          { email: { contains: String(search), mode: 'insensitive' } },
          { phone: { contains: String(search) } },
          { firstName: { contains: String(search), mode: 'insensitive' } },
          { lastName: { contains: String(search), mode: 'insensitive' } },
        ],
      }),
    };
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          phone: true,
          firstName: true,
          lastName: true,
          role: true,
          isVerified: true,
          isActive: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.user.count({ where }),
    ]);
    res.json({
      data: users,
      meta: {
        pagination: {
          page: parseInt(page),
          limit: take,
          total,
          totalPages: Math.ceil(total / take),
        },
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to list users' });
  }
});

// GET /admin/bookings — platform overview
router.get('/bookings', verifyToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const [total, byStatus, recent] = await Promise.all([
      prisma.booking.count(),
      prisma.booking.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      prisma.booking.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { id: true, firstName: true, lastName: true, email: true } },
          service: { select: { name: true, price: true } },
          venue: { select: { name: true } },
        },
      }),
    ]);
    res.json({
      data: {
        totalBookings: total,
        byStatus: Object.fromEntries(byStatus.map((r) => [r.status, r._count._all])),
        recent,
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load bookings overview' });
  }
});

// PATCH /admin/users/:id/ban — deactivate account
router.patch('/users/:id/ban', verifyToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    if (id === req.user.id) {
      return res.status(400).json({ error: 'Cannot ban yourself' });
    }
    const user = await prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: { id: true, email: true, isActive: true },
    });
    res.json({ data: user, meta: { message: 'User banned (deactivated)' } });
  } catch (e) {
    res.status(500).json({ error: 'Failed to ban user' });
  }
});

// PATCH /admin/venues/:id/status - Update venue approval status
router.patch('/venues/:id/status', verifyToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['APPROVED', 'REJECTED', 'SUSPENDED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const venue = await prisma.venue.update({
      where: { id },
      data: { status },
      include: {
        owner: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true }
        },
        services: true
      }
    });

    // Send email notification to venue owner
    try {
      const owner = venue.owner || {};
      await emailService.sendApprovalNotification(owner.email, owner.firstName || owner.firstName, 'Venue', status, { name: venue.name });
    } catch (err) {
      console.error('Error sending venue approval email:', err);
    }

    console.log(`Venue ${id} status updated to ${status}`);

    res.json({
      data: venue,
      meta: { message: `Venue ${status.toLowerCase()}` },
    });
  } catch (error) {
    console.error('Venue status update error:', error);
    res.status(500).json({ error: 'Failed to update venue status' });
  }
});

// PATCH /admin/mobile-providers/:id/status - Update mobile provider approval status
router.patch('/mobile-providers/:id/status', verifyToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['APPROVED', 'REJECTED', 'SUSPENDED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const mobileProvider = await prisma.mobileProvider.update({
      where: { id },
      data: { status },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true }
        },
        services: true
      }
    });

    // Send email notification to mobile provider
    try {
      const user = mobileProvider.user || {};
      await emailService.sendApprovalNotification(user.email, user.firstName || user.firstName, 'Mobile Provider', status, { name: `${user.firstName || ''} ${user.lastName || ''}`.trim() });
    } catch (err) {
      console.error('Error sending mobile provider approval email:', err);
    }

    console.log(`Mobile Provider ${id} status updated to ${status}`);

    res.json({
      data: mobileProvider,
      meta: { message: `Mobile provider ${status.toLowerCase()}` },
    });
  } catch (error) {
    console.error('Mobile provider status update error:', error);
    res.status(500).json({ error: 'Failed to update mobile provider status' });
  }
});

module.exports = router;
