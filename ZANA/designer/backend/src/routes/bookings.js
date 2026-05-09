const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { verifyToken, requireRole } = require('../middleware/auth');
const emailService = require('../services/emailService');
const { sendExpoPush } = require('../services/pushNotifications');
const MOCK_MODE = process.env.MOCK_MODE === 'true' || process.env.MOCK_MODE === '1';
const mock = require('../mock/data');
const mockStore = require('../mock/store');

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

    if (MOCK_MODE) {
      const customerId = req.user.id;
      const list = mockStore.listBookingsForCustomer(customerId).map((b) => ({
        ...b,
        service: mock.services.find((s) => s.id === b.serviceId) || null,
        venue: b.venueId ? mock.venues.find((v) => v.id === b.venueId) || null : null,
        mobileProvider: b.mobileProviderId ? mock.mobileProviders.find((p) => p.id === b.mobileProviderId) || null : null,
        staff: b.staffId ? mock.staff.find((s) => s.id === b.staffId) || null : null,
      }));
      return res.json({ data: list });
    }

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

    res.json({ data: bookings });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single booking
router.get('/:id', verifyToken, async (req, res) => {
  try {
    if (MOCK_MODE) {
      const b = mockStore.getBooking(req.params.id);
      if (!b) return res.status(404).json({ error: 'Booking not found' });
      const booking = {
        ...b,
        service: mock.services.find((s) => s.id === b.serviceId) || null,
        venue: b.venueId ? mock.venues.find((v) => v.id === b.venueId) || null : null,
        mobileProvider: b.mobileProviderId ? mock.mobileProviders.find((p) => p.id === b.mobileProviderId) || null : null,
        staff: b.staffId ? mock.staff.find((s) => s.id === b.staffId) || null : null,
      };
      return res.json({ data: booking });
    }

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

    res.json({ data: booking });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create booking
router.post('/', verifyToken, async (req, res) => {
  try {
    const { serviceId, venueId, mobileProviderId, staffId, date, startTime, notes, clientAddress } = req.body;
    const customerId = req.user.id;

    if (MOCK_MODE) {
      const service = mock.services.find((s) => s.id === serviceId);
      if (!service) return res.status(404).json({ error: 'Service not found' });
      const endTime = startTime; // keep simple for demo
      const booking = mockStore.createBooking({
        customerId,
        serviceId,
        venueId: venueId || null,
        mobileProviderId: mobileProviderId || null,
        staffId: staffId || null,
        date: new Date(date).toISOString(),
        startTime,
        endTime,
        notes: notes || null,
        clientAddress: clientAddress || null,
        totalAmount: service.price,
      });
      return res.status(201).json({ data: booking, meta: { message: 'Booking created successfully (mock mode)' } });
    }

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

    let serviceMode = 'SALON_VISIT';
    if (mobileProviderId) {
      serviceMode = 'MOBILE';
    } else if (venueId) {
      const v = await prisma.venue.findUnique({ where: { id: venueId }, select: { category: true } });
      serviceMode = v?.category === 'BARBERSHOP' ? 'BARBERSHOP_VISIT' : 'SALON_VISIT';
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
        serviceMode,
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

    try {
      let pushToken = null;
      if (booking.venueId) {
        const v = await prisma.venue.findUnique({
          where: { id: booking.venueId },
          include: { owner: { select: { fcmToken: true } } },
        });
        pushToken = v?.owner?.fcmToken;
      } else if (booking.mobileProviderId) {
        const mp = await prisma.mobileProvider.findUnique({
          where: { id: booking.mobileProviderId },
          include: { user: { select: { fcmToken: true } } },
        });
        pushToken = mp?.user?.fcmToken;
      }
      if (pushToken) {
        await sendExpoPush(
          pushToken,
          'New ZANA booking',
          `${booking.customer?.firstName || 'A customer'} booked ${booking.service?.name || 'a service'}`,
          { bookingId: booking.id, type: 'NEW_BOOKING' }
        );
      }
    } catch (pushErr) {
      console.warn('Push notify skipped:', pushErr.message);
    }

    res.status(201).json({ data: booking, meta: { message: 'Booking created successfully' } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cancel booking
router.patch('/:id/cancel', verifyToken, async (req, res) => {
  try {
    if (MOCK_MODE) {
      const updated = mockStore.cancelBooking(req.params.id);
      if (!updated) return res.status(404).json({ error: 'Booking not found' });
      return res.json({ data: updated, meta: { message: 'Booking cancelled (mock mode)' } });
    }

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

    res.json({ data: updated, meta: { message: 'Booking cancelled' } });
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

    res.json({ data: updated, meta: { message: 'Booking confirmed' } });
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

    res.json({ data: updated, meta: { message: 'Booking completed' } });
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

    res.json({ data: updated, meta: { message: 'Booking marked as no-show' } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;