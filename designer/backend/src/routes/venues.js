const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { verifyToken, requireRole } = require('../middleware/auth');
const { validateVenue } = require('../middleware/validation');

const prisma = new PrismaClient();
const router = express.Router();

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
    let where = {
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
      const services = await prisma.service.findMany({
        where: {
          price: { lte: parseFloat(maxPrice) }
        },
        select: { venueId: true }
      });
      const venueIds = services.map(s => s.venueId);
      where.id = { in: venueIds };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Get venues with location filtering
    let venues;
    if (lat && lng) {
      // Use Haversine formula for distance calculation
      venues = await prisma.$queryRaw`
        SELECT v.*, 
               (6371 * acos(
                 cos(radians(${parseFloat(lat)})) * 
                 cos(radians(v.latitude)) * 
                 cos(radians(v.longitude) - radians(${parseFloat(lng)})) + 
                 sin(radians(${parseFloat(lat)})) * 
                 sin(radians(v.latitude))
               )) AS distance
        FROM Venue v
        WHERE v.status = 'APPROVED'
        ${category ? `AND v.category = ${category}` : ''}
        ${minRating > 0 ? `AND v.rating >= ${parseFloat(minRating)}` : ''}
        ${search ? `AND (v.name LIKE '%${search}%' OR v.description LIKE '%${search}%')` : ''}
        HAVING distance <= ${parseFloat(radius)}
        ORDER BY distance
        LIMIT ${take} OFFSET ${skip}
      `;
    } else {
      venues = await prisma.venue.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' }
      });
    }

    // Get total count for pagination
    const total = await prisma.venue.count({ where });
    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      data: venues,
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
    console.error('Error fetching venues:', error);
    res.status(500).json({ error: 'Failed to fetch venues' });
  }
});

// GET /venues/:id - Get single venue with services, staff, reviews
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const venue = await prisma.venue.findUnique({
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

    if (!venue) {
      return res.status(404).json({ error: 'Venue not found' });
    }

    res.json(venue);
  } catch (error) {
    console.error('Error fetching venue:', error);
    res.status(500).json({ error: 'Failed to fetch venue' });
  }
});

// GET /venues/:id/availability - Get available time slots for a date
router.get('/:id/availability', async (req, res) => {
  try {
    const { id } = req.params;
    const { date, serviceId } = req.query;

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
      return res.json({ slots: [] });
    }

    // Get all bookings for the day
    const bookings = await prisma.booking.findMany({
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

    // Generate time slots
    const slots = [];
    const startTime = new Date(`2000-01-01T${openingHour.openTime}:00`);
    const endTime = new Date(`2000-01-01T${openingHour.closeTime}:00`);
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