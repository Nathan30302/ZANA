const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { verifyToken, requireRole } = require('../middleware/auth');

const prisma = new PrismaClient();
const router = express.Router();

// GET /admin/queue - Fetch providers and venues pending approval
router.get('/queue', verifyToken, requireRole(['ADMIN']), async (req, res) => {
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

    // TODO: Send email notification to venue owner
    console.log(`Venue ${id} status updated to ${status}`);

    res.json({
      message: `Venue ${status.toLowerCase()}`,
      venue
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

    // TODO: Send email notification to mobile provider
    console.log(`Mobile Provider ${id} status updated to ${status}`);

    res.json({
      message: `Mobile provider ${status.toLowerCase()}`,
      mobileProvider
    });
  } catch (error) {
    console.error('Mobile provider status update error:', error);
    res.status(500).json({ error: 'Failed to update mobile provider status' });
  }
});

module.exports = router;
