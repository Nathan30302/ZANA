const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { verifyToken, requireRole } = require('../middleware/auth');
const emailService = require('../services/emailService');

const prisma = new PrismaClient();

// Generate booking reference
function generateReference() {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `ZNA-${dateStr}-${random}`;
}

// Get user's bookings
router.get('/', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let bookings;

    if (userRole === 'CUSTOMER') {
      // Customer sees their own bookings
      bookings = await prisma.booking.findMany({
        where: { customerId: userId },
        include: {
          service: {
            include: {
              venue: true,
              mobileProvider: true
            }
          },
          venue: true,
          mobileProvider: {
            include: { user: true }
          },
          staff: {
            include: { user: true }
          },
          review: true
        },
        orderBy: { date: 'desc' }
      });
    } else if (userRole === 'PROVIDER_VENUE') {
      // Venue owner sees bookings for their venue
      const venue = await prisma.venue.findFirst({ where: { ownerId: userId } });
      if (venue) {
        bookings = await prisma.booking.findMany({
          where: { venueId: venue.id },
          include: {
            service: true,
            customer: true,
            staff: { include: { user: true } },
            review: true
          },
          orderBy: { date: 'desc' }
        });
      } else {
        bookings = [];
      }
    } else if (userRole === 'PROVIDER_MOBILE') {
      // Mobile provider sees their own bookings
      const provider = await prisma.mobileProvider.findFirst({ where: { userId } });
      if (provider) {
        bookings = await prisma.booking.findMany({
          where: { mobileProviderId: provider.id },
          include: {
            service: true,
            customer: true,
            review: true
          },
          orderBy: { date: 'desc' }
        });
      } else {
        bookings = [];
      }
    } else if (userRole === 'STAFF') {
      // Staff sees their assigned bookings
      const staff = await prisma.staff.findFirst({ where: { userId } });
      if (staff) {
        bookings = await prisma.booking.findMany({
          where: { staffId: staff.id },
          include: {
            service: { include: { venue: true } },
            customer: true,
            venue: true,
            review: true
          },
          orderBy: { date: 'desc' }
        });
      } else {
        bookings = [];
      }
    } else {
      bookings = [];
    }

    res.json({ bookings });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single booking
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: {
        service: {
          include: {
            venue: true,
            mobileProvider: true
          }
        },
        customer: true,
        venue: true,
        mobileProvider: { include: { user: true } },
        staff: { include: { user: true } },
        review: true
      }
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.json({ booking });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create booking
router.post('/', verifyToken, async (req, res) => {
  try {
    const { serviceId, venueId, mobileProviderId, staffId, date, startTime, notes, clientAddress } = req.body;
    const customerId = req.user.id;

    // Get service details
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: { venue: true, mobileProvider: true }
    });

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    // Calculate end time
    const startParts = startTime.split(':');
    const endMinutes = parseInt(startParts[0]) * 60 + parseInt(startParts[1]) + service.duration;
    const endHours = Math.floor(endMinutes / 60);
    const endMins = endMinutes % 60;
    const endTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;

    // Check for conflicts
    const conflicts = await prisma.booking.findMany({
      where: {
        AND: [
          { date: new Date(date) },
          {
            OR: [
              { venueId: venueId },
              { mobileProviderId: mobileProviderId }
            ]
          },
          {
            OR: [
              { status: 'PENDING' },
              { status: 'CONFIRMED' }
            ]
          }
        ]
      }
    });

    // Simple conflict check (could be more sophisticated)
    const hasConflict = conflicts.some(booking => {
      const bookingStart = booking.startTime;
      const bookingEnd = booking.endTime;
      return (startTime < bookingEnd && endTime > bookingStart);
    });

    if (hasConflict) {
      return res.status(409).json({ error: 'This time slot is already booked' });
    }

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        reference: generateReference(),
        customerId,
        serviceId,
        venueId,
        mobileProviderId,
        staffId,
        date: new Date(date),
        startTime,
        endTime,
        status: 'PENDING',
        serviceMode: mobileProviderId ? 'MOBILE' : (venueId ? 'SALON_VISIT' : 'BARBERSHOP_VISIT'),
        notes,
        clientAddress: mobileProviderId ? clientAddress : null,
        totalAmount: service.price
      },
      include: {
        service: true,
        customer: true,
        venue: true,
        mobileProvider: { include: { user: true } },
        staff: { include: { user: true } }
      }
    });

    if (booking.customer?.email) {
      await emailService.sendBookingConfirmation(
        booking.customer.email,
        booking,
        booking.customer.firstName || 'Customer'
      );
    }

    const providerEmail = booking.mobileProvider?.user?.email || booking.venue?.email;
    const providerName = booking.mobileProvider?.user?.firstName || booking.venue?.name;
    if (providerEmail) {
      await emailService.sendProviderBookingNotification(
        providerEmail,
        booking,
        providerName || 'Provider'
      );
    }

    res.status(201).json({ booking, message: 'Booking created successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cancel booking
router.patch('/:id/cancel', verifyToken, async (req, res) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id }
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check if user can cancel this booking
    const canCancel = 
      booking.customerId === req.user.id ||
      req.user.role === 'ADMIN';

    if (!canCancel) {
      return res.status(403).json({ error: 'Not authorized to cancel this booking' });
    }

    const updated = await prisma.booking.update({
      where: { id: req.params.id },
      data: { status: 'CANCELLED' },
      include: { service: true, customer: true }
    });

    res.json({ booking: updated, message: 'Booking cancelled' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Confirm booking (provider only)
router.patch('/:id/confirm', verifyToken, requireRole(['PROVIDER_VENUE', 'PROVIDER_MOBILE', 'STAFF', 'ADMIN']), async (req, res) => {
  try {
    if (!['PROVIDER_VENUE', 'PROVIDER_MOBILE', 'STAFF', 'ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const updated = await prisma.booking.update({
      where: { id: req.params.id },
      data: { status: 'CONFIRMED' },
      include: { service: true, customer: true }
    });

    if (updated.customer?.email) {
      await emailService.sendBookingConfirmation(
        updated.customer.email,
        updated,
        updated.customer.firstName || 'Customer'
      );
    }

    res.json({ booking: updated, message: 'Booking confirmed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Complete booking (provider only)
router.patch('/:id/complete', verifyToken, requireRole(['PROVIDER_VENUE', 'PROVIDER_MOBILE', 'STAFF', 'ADMIN']), async (req, res) => {
  try {
    if (!['PROVIDER_VENUE', 'PROVIDER_MOBILE', 'STAFF', 'ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const updated = await prisma.booking.update({
      where: { id: req.params.id },
      data: { status: 'COMPLETED' },
      include: { service: true, customer: true }
    });

    res.json({ booking: updated, message: 'Booking completed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark as no-show (provider only)
router.patch('/:id/no-show', verifyToken, requireRole(['PROVIDER_VENUE', 'PROVIDER_MOBILE', 'STAFF', 'ADMIN']), async (req, res) => {
  try {
    if (!['PROVIDER_VENUE', 'PROVIDER_MOBILE', 'STAFF', 'ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const updated = await prisma.booking.update({
      where: { id: req.params.id },
      data: { status: 'NO_SHOW' },
      include: { service: true, customer: true }
    });

    res.json({ booking: updated, message: 'Booking marked as no-show' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;