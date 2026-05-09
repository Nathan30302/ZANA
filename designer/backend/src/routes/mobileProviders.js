const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { verifyToken, requireRole } = require('../middleware/auth');
const { validateMobileProvider } = require('../middleware/validation');

const prisma = new PrismaClient();
const router = express.Router();
const MOCK_MODE = process.env.MOCK_MODE === 'true' || process.env.MOCK_MODE === '1';
const mock = require('../mock/data');

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// GET /mobile-providers - List mobile providers with filters
router.get('/', async (req, res) => {
  try {
    const {
      lat,
      lng,
      radius = 10,
      minRating = 0,
      maxPrice,
      search,
      page = 1,
      limit = 20
    } = req.query;

    // Build where clause
    const where = {
      status: 'APPROVED', // Only show approved providers
      ...(minRating > 0 && { rating: { gte: parseFloat(minRating) } }),
      ...(search && {
        OR: [
          { bio: { contains: search, mode: 'insensitive' } },
          { user: { firstName: { contains: search, mode: 'insensitive' } } },
          { user: { lastName: { contains: search, mode: 'insensitive' } } }
        ]
      })
    };

    // Filter by price if maxPrice is provided
    if (maxPrice) {
      let services = [];
      try {
        services = await prisma.service.findMany({
          where: {
            price: { lte: parseFloat(maxPrice) },
            mobileProviderId: { not: null }
          },
          select: { mobileProviderId: true }
        });
      } catch (e) {
        if (!MOCK_MODE) throw e;
        services = mock.services
          .filter((s) => s.mobileProviderId && s.isActive && s.price <= parseFloat(maxPrice))
          .map((s) => ({ mobileProviderId: s.mobileProviderId }));
      }
      const providerIds = services.map(s => s.mobileProviderId);
      if (providerIds.length === 0) {
        return res.json({
          data: [],
          meta: {
            pagination: {
              page: parseInt(page),
              limit: parseInt(limit),
              total: 0,
              totalPages: 0,
              hasNext: false,
              hasPrev: false
            }
          }
        });
      }
      where.id = { in: providerIds };
    }

    const candidates = await prisma.mobileProvider.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true
          }
        },
        services: {
          where: { isActive: true },
          orderBy: { price: 'asc' }
        }
      }
    });

    let filtered = candidates;
    if (lat && lng) {
      const latNum = parseFloat(lat);
      const lngNum = parseFloat(lng);
      const radiusNum = parseFloat(radius);
      filtered = candidates
        .map((p) => ({
          ...p,
          distanceKm: haversineKm(latNum, lngNum, p.baseLat, p.baseLng)
        }))
        .filter((p) => p.distanceKm <= radiusNum)
        .sort((a, b) => a.distanceKm - b.distanceKm);
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const total = filtered.length;
    const totalPages = Math.ceil(total / limitNum);
    const start = (pageNum - 1) * limitNum;
    const end = start + limitNum;
    const providers = filtered.slice(start, end);

    res.json({
      data: providers,
      meta: {
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1
        }
      }
    });
    // Fallback to mock mode if DB is down
    // eslint-disable-next-line no-unused-vars
  } catch (error) {
    console.error('Error fetching mobile providers:', error);
    const isDbDown =
      (error && typeof error.message === 'string' && (error.message.includes('connect') || error.message.includes("Can't reach database server"))) ||
      (error && typeof error.code === 'string' && error.code.startsWith('P'));
    if (MOCK_MODE && isDbDown) {
      const pageNum = parseInt(req.query.page || '1');
      const limitNum = parseInt(req.query.limit || '20');
      const candidates = mock.mobileProviders.filter((p) => p.status === 'APPROVED');

      let filtered = candidates;
      const lat = req.query.lat;
      const lng = req.query.lng;
      const radius = req.query.radius || 10;
      if (lat && lng) {
        const latNum = parseFloat(lat);
        const lngNum = parseFloat(lng);
        const radiusNum = parseFloat(radius);
        filtered = candidates
          .map((p) => ({
            ...p,
            distanceKm: haversineKm(latNum, lngNum, p.baseLat, p.baseLng)
          }))
          .filter((p) => p.distanceKm <= radiusNum)
          .sort((a, b) => a.distanceKm - b.distanceKm);
      }

      const total = filtered.length;
      const totalPages = Math.ceil(total / limitNum);
      const start = (pageNum - 1) * limitNum;
      const end = start + limitNum;
      const providers = filtered.slice(start, end).map((p) => ({
        ...p,
        services: mock.services.filter((s) => s.mobileProviderId === p.id && s.isActive),
      }));

      return res.json({
        data: providers,
        meta: {
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages,
            hasNext: pageNum < totalPages,
            hasPrev: pageNum > 1
          }
        }
      });
    }

    res.status(isDbDown ? 503 : 500).json({
      error: isDbDown ? 'Database unavailable' : 'Failed to fetch mobile providers'
    });
  }
});

// GET /mobile-providers/profile - Get current mobile provider profile
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const provider = await prisma.mobileProvider.findFirst({
      where: { userId: req.user.id }
    });

    if (!provider) {
      return res.status(404).json({ error: 'Mobile provider profile not found' });
    }

    res.json(provider);
  } catch (error) {
    console.error('Error fetching mobile provider profile:', error);
    res.status(500).json({ error: 'Failed to fetch mobile provider profile' });
  }
});

// GET /mobile-providers/:id - Get provider profile with services and reviews
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    let provider = null;
    try {
      provider = await prisma.mobileProvider.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true
            }
          },
          services: {
            where: { isActive: true },
            orderBy: { price: 'asc' }
          },
          reviews: {
            include: {
              customer: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  avatarUrl: true
                }
              }
            },
            orderBy: { createdAt: 'desc' },
            take: 10
          }
        }
      });
    } catch (e) {
      if (!MOCK_MODE) throw e;
      const base = mock.mobileProviders.find((p) => p.id === id) || null;
      if (base) {
        provider = {
          ...base,
          services: mock.services.filter((s) => s.mobileProviderId === id && s.isActive),
          reviews: [],
        };
      }
    }

    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    res.json({ data: provider });
  } catch (error) {
    console.error('Error fetching provider:', error);
    res.status(500).json({ error: 'Failed to fetch provider' });
  }
});

// GET /mobile-providers/:id/availability - Get available time slots for a date
router.get('/:id/availability', async (req, res) => {
  try {
    const { id } = req.params;
    const { date, serviceId } = req.query;

    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }

    const provider = await prisma.mobileProvider.findUnique({
      where: { id }
    });

    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    const targetDate = new Date(date);

    // Get all bookings for the day
    const bookings = await prisma.booking.findMany({
      where: {
        mobileProviderId: id,
        date: targetDate,
        status: {
          in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS']
        }
      },
      include: {
        service: true
      }
    });

    // Generate time slots (8 AM to 6 PM)
    const slots = [];
    const startTime = new Date(`2000-01-01T08:00:00`);
    const endTime = new Date(`2000-01-01T18:00:00`);
    const slotDuration = 30; // minutes

    // Get service duration if serviceId is provided
    let serviceDuration = 60; // default 1 hour
    if (serviceId) {
      const service = await prisma.service.findUnique({
        where: { id: serviceId }
      });
      if (service) {
        serviceDuration = service.duration;
      }
    }

    for (let time = new Date(startTime); time < endTime; time.setMinutes(time.getMinutes() + slotDuration)) {
      const slotTime = time.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
      
      // Check if slot is available
      const isBooked = bookings.some(booking => {
        const bookingTime = new Date(booking.date);
        const bookingStart = bookingTime.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
        
        // Check if this slot overlaps with any booking
        const slotEnd = new Date(time.getTime() + serviceDuration * 60000);
        const bookingEnd = new Date(bookingTime.getTime() + booking.service.duration * 60000);
        
        return (time < bookingEnd && slotEnd > bookingTime);
      });

      if (!isBooked) {
        slots.push({
          time: slotTime,
          available: true
        });
      }
    }

    res.json({ data: { timeSlots: slots } });
  } catch (error) {
    console.error('Error fetching availability:', error);
    res.status(500).json({ error: 'Failed to fetch availability' });
  }
});

// POST /mobile-providers - Create mobile provider profile (requires PROVIDER_MOBILE role)
router.post('/', verifyToken, requireRole(['PROVIDER_MOBILE']), validateMobileProvider, async (req, res) => {
  try {
    const {
      bio,
      portfolioPhotos,
      baseLat,
      baseLng,
      serviceRadius
    } = req.body;

    // Check if user already has a mobile provider profile
    const existingProvider = await prisma.mobileProvider.findFirst({
      where: { userId: req.user.id }
    });

    if (existingProvider) {
      return res.status(400).json({ error: 'You already have a mobile provider profile' });
    }

    const provider = await prisma.mobileProvider.create({
      data: {
        userId: req.user.id,
        bio,
        portfolioPhotos: portfolioPhotos || [],
        baseLat,
        baseLng,
        serviceRadius,
        status: 'PENDING' // Pending admin approval
      }
    });

    res.status(201).json(provider);
  } catch (error) {
    console.error('Error creating mobile provider:', error);
    res.status(500).json({ error: 'Failed to create mobile provider' });
  }
});

// PUT /mobile-providers/:id - Update provider profile (owner only)
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      bio,
      portfolioPhotos,
      baseLat,
      baseLng,
      serviceRadius
    } = req.body;

    // Check if user owns this provider profile
    const provider = await prisma.mobileProvider.findUnique({
      where: { id }
    });

    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    if (provider.userId !== req.user.id) {
      return res.status(403).json({ error: 'You can only update your own profile' });
    }

    const updatedProvider = await prisma.mobileProvider.update({
      where: { id },
      data: {
        bio,
        portfolioPhotos,
        baseLat,
        baseLng,
        serviceRadius
      }
    });

    res.json(updatedProvider);
  } catch (error) {
    console.error('Error updating mobile provider:', error);
    res.status(500).json({ error: 'Failed to update mobile provider' });
  }
});

// PATCH /mobile-providers/:id/status - Approve/suspend/reject provider (admin only)
router.patch('/:id/status', verifyToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['PENDING', 'APPROVED', 'SUSPENDED', 'REJECTED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const provider = await prisma.mobileProvider.findUnique({
      where: { id }
    });

    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    const updatedProvider = await prisma.mobileProvider.update({
      where: { id },
      data: { status }
    });

    res.json(updatedProvider);
  } catch (error) {
    console.error('Error updating provider status:', error);
    res.status(500).json({ error: 'Failed to update provider status' });
  }
});

module.exports = router;