const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { verifyToken, requireRole } = require('../middleware/auth');
const { validateService } = require('../middleware/validation');

const prisma = new PrismaClient();
const router = express.Router();
const MOCK_MODE = process.env.MOCK_MODE === 'true' || process.env.MOCK_MODE === '1';
const mock = require('../mock/data');

// GET /services/:id - Fetch single service (used by customer booking funnel)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let service = null;
    try {
      service = await prisma.service.findUnique({
        where: { id },
        include: {
          venue: true,
          mobileProvider: {
            include: {
              user: {
                select: { id: true, firstName: true, lastName: true, avatarUrl: true }
              }
            }
          }
        }
      });
    } catch (e) {
      if (!MOCK_MODE) throw e;
      service = mock.services.find((s) => s.id === id) || null;
      if (service) {
        service = {
          ...service,
          venue: service.venueId ? mock.venues.find((v) => v.id === service.venueId) || null : null,
          mobileProvider: service.mobileProviderId
            ? (mock.mobileProviders.find((p) => p.id === service.mobileProviderId) || null)
            : null,
        };
      }
    }

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    res.json({ data: service });
  } catch (error) {
    console.error('Error fetching service:', error);
    res.status(500).json({ error: 'Failed to fetch service' });
  }
});

// GET /venues/:id/services - List all services for a venue
router.get('/venues/:id/services', async (req, res) => {
  try {
    const { id } = req.params;
    
    let venue = null;
    try {
      venue = await prisma.venue.findUnique({
        where: { id }
      });
    } catch (e) {
      if (!MOCK_MODE) throw e;
      venue = mock.venues.find((v) => v.id === id) || null;
    }

    if (!venue) {
      return res.status(404).json({ error: 'Venue not found' });
    }

    let services = [];
    try {
      services = await prisma.service.findMany({
        where: { 
          venueId: id,
          isActive: true
        },
        orderBy: { price: 'asc' }
      });
    } catch (e) {
      if (!MOCK_MODE) throw e;
      services = mock.services.filter((s) => s.venueId === id && s.isActive);
    }

    res.json({ data: services });
  } catch (error) {
    console.error('Error fetching venue services:', error);
    res.status(500).json({ error: 'Failed to fetch venue services' });
  }
});

// POST /venues/:id/services - Add service to venue (owner only)
router.post('/venues/:id/services', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      category,
      price,
      duration
    } = req.body;

    // Check if user owns this venue
    const venue = await prisma.venue.findUnique({
      where: { id }
    });

    if (!venue) {
      return res.status(404).json({ error: 'Venue not found' });
    }

    if (venue.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'You can only add services to your own venue' });
    }

    const service = await prisma.service.create({
      data: {
        name,
        description,
        category,
        price,
        duration,
        venueId: id
      }
    });

    res.status(201).json({ data: service });
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(500).json({ error: 'Failed to create service' });
  }
});

// PUT /venues/:venueId/services/:serviceId - Update a service (owner only)
router.put('/venues/:venueId/services/:serviceId', verifyToken, async (req, res) => {
  try {
    const { venueId, serviceId } = req.params;
    const {
      name,
      description,
      category,
      price,
      duration,
      isActive
    } = req.body;

    // Check if user owns this venue
    const venue = await prisma.venue.findUnique({
      where: { id: venueId }
    });

    if (!venue) {
      return res.status(404).json({ error: 'Venue not found' });
    }

    if (venue.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'You can only update services for your own venue' });
    }

    // Check if service belongs to this venue
    const service = await prisma.service.findUnique({
      where: { id: serviceId }
    });

    if (!service || service.venueId !== venueId) {
      return res.status(404).json({ error: 'Service not found' });
    }

    const updatedService = await prisma.service.update({
      where: { id: serviceId },
      data: {
        name,
        description,
        category,
        price,
        duration,
        isActive
      }
    });

    res.json({ data: updatedService });
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({ error: 'Failed to update service' });
  }
});

// DELETE /venues/:venueId/services/:serviceId - Remove a service (owner only)
router.delete('/venues/:venueId/services/:serviceId', verifyToken, async (req, res) => {
  try {
    const { venueId, serviceId } = req.params;

    // Check if user owns this venue
    const venue = await prisma.venue.findUnique({
      where: { id: venueId }
    });

    if (!venue) {
      return res.status(404).json({ error: 'Venue not found' });
    }

    if (venue.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete services from your own venue' });
    }

    // Check if service belongs to this venue
    const service = await prisma.service.findUnique({
      where: { id: serviceId }
    });

    if (!service || service.venueId !== venueId) {
      return res.status(404).json({ error: 'Service not found' });
    }

    await prisma.service.delete({
      where: { id: serviceId }
    });

    res.json({ data: { ok: true }, meta: { message: 'Service deleted successfully' } });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({ error: 'Failed to delete service' });
  }
});

// POST /mobile-providers/:id/services - Add service for mobile provider (owner only)
router.post('/mobile-providers/:id/services', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      category,
      price,
      duration
    } = req.body;

    // Check if user owns this mobile provider profile
    const provider = await prisma.mobileProvider.findUnique({
      where: { id }
    });

    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    if (provider.userId !== req.user.id) {
      return res.status(403).json({ error: 'You can only add services to your own profile' });
    }

    const service = await prisma.service.create({
      data: {
        name,
        description,
        category,
        price,
        duration,
        mobileProviderId: id
      }
    });

    res.status(201).json({ data: service });
  } catch (error) {
    console.error('Error creating mobile provider service:', error);
    res.status(500).json({ error: 'Failed to create service' });
  }
});

module.exports = router;