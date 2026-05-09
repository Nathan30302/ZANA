const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { verifyToken, requireRole } = require('../middleware/auth');
const { validateVenue } = require('../middleware/validation');

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

// GET /venues - List venues with filters
router.get('/', async (req, res) => {
  try {
    const {
      category,
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
      status: 'APPROVED', // Only show approved venues
      ...(category && { category }),
      ...(minRating > 0 && { rating: { gte: parseFloat(minRating) } }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    // Filter by price if maxPrice is provided
    if (maxPrice) {
      let services = [];
      try {
        services = await prisma.service.findMany({
          where: {
            price: { lte: parseFloat(maxPrice) }
          },
          select: { venueId: true }
        });
      } catch (e) {
        if (!MOCK_MODE) throw e;
        services = mock.services
          .filter((s) => s.venueId && s.isActive && s.price <= parseFloat(maxPrice))
          .map((s) => ({ venueId: s.venueId }));
      }
      const venueIds = services.map(s => s.venueId);
      // If none match, return empty list without querying Venue table further
      if (venueIds.length === 0) {
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
      where.id = { in: venueIds };
    }

    // Fetch candidates with Prisma (no raw SQL injection risk)
    let candidates;
    try {
      candidates = await prisma.venue.findMany({
        where,
        orderBy: { createdAt: 'desc' }
      });
    } catch (e) {
      if (!MOCK_MODE) throw e;
      candidates = mock.venues.filter((v) => v.status === 'APPROVED');
    }

    let filtered = candidates;
    if (lat && lng) {
      const latNum = parseFloat(lat);
      const lngNum = parseFloat(lng);
      const radiusNum = parseFloat(radius);
      filtered = candidates
        .map((v) => ({
          ...v,
          distanceKm: haversineKm(latNum, lngNum, v.latitude, v.longitude)
        }))
        .filter((v) => v.distanceKm <= radiusNum)
        .sort((a, b) => a.distanceKm - b.distanceKm);
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const total = filtered.length;
    const totalPages = Math.ceil(total / limitNum);
    const start = (pageNum - 1) * limitNum;
    const end = start + limitNum;
    const venues = filtered.slice(start, end);

    res.json({
      data: venues,
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
  } catch (error) {
    console.error('Error fetching venues:', error);
    const isDbDown =
      (error && typeof error.message === 'string' && (error.message.includes('connect') || error.message.includes("Can't reach database server"))) ||
      (error && typeof error.code === 'string' && error.code.startsWith('P'));
    res.status(isDbDown ? 503 : 500).json({
      error: isDbDown ? 'Database unavailable' : 'Failed to fetch venues'
    });
  }
});

// GET /venues/:id/reviews — spec alias (paginated list)
router.get('/:id/reviews', async (req, res) => {
  try {
    const { id } = req.params;
    const take = Math.min(parseInt(req.query.limit || '20', 10), 50);
    const reviews = await prisma.review.findMany({
      where: { venueId: id },
      include: {
        customer: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
      take,
    });
    res.json({ data: reviews });
  } catch (error) {
    console.error('Venue reviews error:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// GET /venues/:id - Get single venue with services, staff, reviews
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    let venue;
    try {
      venue = await prisma.venue.findUnique({
        where: { id },
        include: {
          services: {
            where: { isActive: true },
            orderBy: { price: 'asc' }
          },
          staff: {
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
          },
          openingHours: true,
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
      const base = mock.venues.find((v) => v.id === id) || null;
      if (base) {
        venue = {
          ...base,
          services: mock.services.filter((s) => s.venueId === id && s.isActive),
          staff: mock.staff.filter((st) => st.venueId === id && st.isActive),
          openingHours: mock.openingHours.filter((h) => h.venueId === id),
          reviews: [],
        };
      } else {
        venue = null;
      }
    }

    if (!venue) {
      return res.status(404).json({ error: 'Venue not found' });
    }

    res.json({ data: venue });
  } catch (error) {
    console.error('Error fetching venue:', error);
    res.status(500).json({ error: 'Failed to fetch venue' });
  }
});

// GET /venues/:id/availability - Get available time slots for a date
router.get('/:id/availability', async (req, res) => {
  try {
    const { id } = req.params;
    const { date, serviceId, staffId } = req.query;

    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }

    const venue = await prisma.venue.findUnique({
      where: { id },
      include: { openingHours: true }
    });

    if (!venue) {
      return res.status(404).json({ error: 'Venue not found' });
    }

    const targetDate = new Date(date);
    const dayOfWeek = targetDate.getDay(); // 0 = Sunday, 1 = Monday, etc.

    // Get opening hours for the day
    const openingHour = venue.openingHours.find(h => h.dayOfWeek === dayOfWeek);
    
    if (!openingHour || openingHour.isClosed) {
      return res.json({ data: { timeSlots: [] } });
    }

    // Get all bookings for the day
    let bookings = [];
    try {
      bookings = await prisma.booking.findMany({
        where: {
          venueId: id,
          date: targetDate,
          status: {
            in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS']
          }
        },
        include: {
          service: true
        }
      });
    } catch (e) {
      if (!MOCK_MODE) throw e;
      bookings = [];
    }

    // Staff-specific availability (optional). If provided, clamp working window to availability records.
    let staffWindows = null;
    if (staffId) {
      const availability = await prisma.availability.findMany({
        where: { staffId: String(staffId), date: targetDate, isBlocked: false },
        orderBy: [{ startTime: 'asc' }]
      });
      staffWindows = availability.map((a) => ({ startTime: a.startTime, endTime: a.endTime }));
    }

    // Generate time slots
    const timeSlots = [];
    const startTime = new Date(`2000-01-01T${openingHour.openTime}:00`);
    const endTime = new Date(`2000-01-01T${openingHour.closeTime}:00`);
    const slotDuration = 30; // minutes
    const bufferMinutes = 10; // small buffer between appointments

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
      
      if (staffWindows) {
        const within = staffWindows.some((w) => {
          const ws = new Date(`2000-01-01T${w.startTime}:00`);
          const we = new Date(`2000-01-01T${w.endTime}:00`);
          const slotEnd = new Date(time.getTime() + (serviceDuration + bufferMinutes) * 60000);
          return time >= ws && slotEnd <= we;
        });
        if (!within) continue;
      }

      // Check if slot is available
      const isBooked = bookings.some(booking => {
        const bookingTime = new Date(booking.date);
        // Check if this slot overlaps with any booking
        const slotEnd = new Date(time.getTime() + (serviceDuration + bufferMinutes) * 60000);
        const bookingEnd = new Date(bookingTime.getTime() + (booking.service.duration + bufferMinutes) * 60000);
        
        return (time < bookingEnd && slotEnd > bookingTime);
      });

      if (!isBooked) {
        timeSlots.push({
          time: slotTime,
          available: true
        });
      }
    }

    res.json({ data: { timeSlots } });
  } catch (error) {
    console.error('Error fetching availability:', error);
    res.status(500).json({ error: 'Failed to fetch availability' });
  }
});

// POST /venues - Create new venue (requires PROVIDER_VENUE role)
router.post('/', verifyToken, requireRole(['PROVIDER_VENUE']), validateVenue, async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      phone,
      email,
      address,
      city,
      latitude,
      longitude,
      coverPhoto,
      photos,
      amenities
    } = req.body;

    const venue = await prisma.venue.create({
      data: {
        name,
        description,
        category,
        phone,
        email,
        address,
        city,
        latitude,
        longitude,
        coverPhoto,
        photos: photos || [],
        amenities: amenities || [],
        ownerId: req.user.id,
        status: 'PENDING' // Pending admin approval
      }
    });

    res.status(201).json(venue);
  } catch (error) {
    console.error('Error creating venue:', error);
    res.status(500).json({ error: 'Failed to create venue' });
  }
});

// PUT /venues/:id - Update venue details (owner only)
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      category,
      phone,
      email,
      address,
      city,
      latitude,
      longitude,
      coverPhoto,
      photos,
      amenities
    } = req.body;

    // Check if user owns this venue
    const venue = await prisma.venue.findUnique({
      where: { id }
    });

    if (!venue) {
      return res.status(404).json({ error: 'Venue not found' });
    }

    if (venue.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'You can only update your own venue' });
    }

    const updatedVenue = await prisma.venue.update({
      where: { id },
      data: {
        name,
        description,
        category,
        phone,
        email,
        address,
        city,
        latitude,
        longitude,
        coverPhoto,
        photos,
        amenities
      }
    });

    res.json(updatedVenue);
  } catch (error) {
    console.error('Error updating venue:', error);
    res.status(500).json({ error: 'Failed to update venue' });
  }
});

// POST /venues/:id/photos - Upload venue photos
router.post('/:id/photos', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { photos } = req.body;

    if (!photos || !Array.isArray(photos)) {
      return res.status(400).json({ error: 'Photos array is required' });
    }

    // Check if user owns this venue
    const venue = await prisma.venue.findUnique({
      where: { id }
    });

    if (!venue) {
      return res.status(404).json({ error: 'Venue not found' });
    }

    if (venue.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'You can only update photos for your own venue' });
    }

    const updatedVenue = await prisma.venue.update({
      where: { id },
      data: {
        photos: {
          push: photos
        }
      }
    });

    res.json(updatedVenue);
  } catch (error) {
    console.error('Error uploading photos:', error);
    res.status(500).json({ error: 'Failed to upload photos' });
  }
});

// DELETE /venues/:id - Delete venue (admin only)
router.delete('/:id', verifyToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;

    const venue = await prisma.venue.findUnique({
      where: { id }
    });

    if (!venue) {
      return res.status(404).json({ error: 'Venue not found' });
    }

    await prisma.venue.delete({
      where: { id }
    });

    res.json({ message: 'Venue deleted successfully' });
  } catch (error) {
    console.error('Error deleting venue:', error);
    res.status(500).json({ error: 'Failed to delete venue' });
  }
});

// PATCH /venues/:id/status - Approve/suspend/reject venue (admin only)
router.patch('/:id/status', verifyToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['PENDING', 'APPROVED', 'SUSPENDED', 'REJECTED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const venue = await prisma.venue.findUnique({
      where: { id }
    });

    if (!venue) {
      return res.status(404).json({ error: 'Venue not found' });
    }

    const updatedVenue = await prisma.venue.update({
      where: { id },
      data: { status }
    });

    res.json(updatedVenue);
  } catch (error) {
    console.error('Error updating venue status:', error);
    res.status(500).json({ error: 'Failed to update venue status' });
  }
});

module.exports = router;