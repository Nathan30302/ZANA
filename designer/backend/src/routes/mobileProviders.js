const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { verifyToken, requireRole } = require('../middleware/auth');
const { validateMobileProvider } = require('../middleware/validation');

const prisma = new PrismaClient();
const router = express.Router();

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
    let where = {
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
      const services = await prisma.service.findMany({
        where: {
          price: { lte: parseFloat(maxPrice) },
          mobileProviderId: { not: null }
        },
        select: { mobileProviderId: true }
      });
      const providerIds = services.map(s => s.mobileProviderId);
      where.id = { in: providerIds };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Get mobile providers with location filtering
    let providers;
    if (lat && lng) {
      // Use Haversine formula for distance calculation
      providers = await prisma.$queryRaw`
        SELECT mp.*, 
               u.firstName,
               u.lastName,
               u.avatarUrl,
               (6371 * acos(
                 cos(radians(${parseFloat(lat)})) * 
                 cos(radians(mp.baseLat)) * 
                 cos(radians(mp.baseLng) - radians(${parseFloat(lng)})) + 
                 sin(radians(${parseFloat(lat)})) * 
                 sin(radians(mp.baseLat))
               )) AS distance
        FROM MobileProvider mp
        JOIN User u ON mp.userId = u.id
        WHERE mp.status = 'APPROVED'
        ${minRating > 0 ? `AND mp.rating >= ${parseFloat(minRating)}` : ''}
        ${search ? `AND (mp.bio LIKE '%${search}%' OR u.firstName LIKE '%${search}%' OR u.lastName LIKE '%${search}%')` : ''}
        HAVING distance <= ${parseFloat(radius)}
        ORDER BY distance
        LIMIT ${take} OFFSET ${skip}
      `;
    } else {
      providers = await prisma.mobileProvider.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true
            }
          }
        }
      });
    }

    // Get total count for pagination
    const total = await prisma.mobileProvider.count({ where });
    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      data: providers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages,
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching mobile providers:', error);
    res.status(500).json({ error: 'Failed to fetch mobile providers' });
  }
});

// GET /mobile-providers/:id - Get provider profile with services and reviews
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const provider = await prisma.mobileProvider.findUnique({
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

    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    res.json(provider);
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

    res.json({ slots });
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