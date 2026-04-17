const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { verifyToken, requireRole } = require('../middleware/auth');

const prisma = new PrismaClient();

// Get reviews for a venue
router.get('/venue/:venueId', async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { venueId: req.params.venueId },
      include: {
        customer: true,
        booking: true
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    res.json({ reviews });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get reviews for a mobile provider
router.get('/provider/:providerId', async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { mobileProviderId: req.params.providerId },
      include: {
        customer: true,
        booking: true
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    res.json({ reviews });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a review
router.post('/', verifyToken, requireRole('CUSTOMER'), async (req, res) => {
  try {
    const { bookingId, rating, comment, venueId, mobileProviderId } = req.body;
    const customerId = req.user.id;

    // Validate rating
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Check if booking exists and belongs to customer
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { review: true }
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.customerId !== customerId) {
      return res.status(403).json({ error: 'Not authorized to review this booking' });
    }

    // Check if booking is completed
    if (booking.status !== 'COMPLETED') {
      return res.status(400).json({ error: 'Can only review completed bookings' });
    }

    // Check if review already exists
    if (booking.review) {
      return res.status(400).json({ error: 'Review already submitted for this booking' });
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        bookingId,
        customerId,
        venueId,
        mobileProviderId,
        rating,
        comment
      },
      include: {
        customer: true,
        booking: true
      }
    });

    // Update venue rating if applicable
    if (venueId) {
      const venueReviews = await prisma.review.findMany({
        where: { venueId },
        select: { rating: true }
      });

      const avgRating = venueReviews.reduce((sum, r) => sum + r.rating, 0) / venueReviews.length;

      await prisma.venue.update({
        where: { id: venueId },
        data: {
          rating: Math.round(avgRating * 10) / 10,
          reviewCount: venueReviews.length
        }
      });
    }

    // Update mobile provider rating if applicable
    if (mobileProviderId) {
      const providerReviews = await prisma.review.findMany({
        where: { mobileProviderId },
        select: { rating: true }
      });

      const avgRating = providerReviews.reduce((sum, r) => sum + r.rating, 0) / providerReviews.length;

      await prisma.mobileProvider.update({
        where: { id: mobileProviderId },
        data: {
          rating: Math.round(avgRating * 10) / 10,
          reviewCount: providerReviews.length
        }
      });
    }

    res.status(201).json({ review, message: 'Review submitted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a review (admin only)
router.delete('/:id', verifyToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const review = await prisma.review.findUnique({
      where: { id: req.params.id },
      include: {
        venue: true,
        mobileProvider: true
      }
    });

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Delete the review
    await prisma.review.delete({
      where: { id: req.params.id }
    });

    // Recalculate venue rating if applicable
    if (review.venueId) {
      const venueReviews = await prisma.review.findMany({
        where: { venueId: review.venueId },
        select: { rating: true }
      });

      if (venueReviews.length > 0) {
        const avgRating = venueReviews.reduce((sum, r) => sum + r.rating, 0) / venueReviews.length;
        await prisma.venue.update({
          where: { id: review.venueId },
          data: {
            rating: Math.round(avgRating * 10) / 10,
            reviewCount: venueReviews.length
          }
        });
      } else {
        await prisma.venue.update({
          where: { id: review.venueId },
          data: { rating: 0, reviewCount: 0 }
        });
      }
    }

    // Recalculate mobile provider rating if applicable
    if (review.mobileProviderId) {
      const providerReviews = await prisma.review.findMany({
        where: { mobileProviderId: review.mobileProviderId },
        select: { rating: true }
      });

      if (providerReviews.length > 0) {
        const avgRating = providerReviews.reduce((sum, r) => sum + r.rating, 0) / providerReviews.length;
        await prisma.mobileProvider.update({
          where: { id: review.mobileProviderId },
          data: {
            rating: Math.round(avgRating * 10) / 10,
            reviewCount: providerReviews.length
          }
        });
      } else {
        await prisma.mobileProvider.update({
          where: { id: review.mobileProviderId },
          data: { rating: 0, reviewCount: 0 }
        });
      }
    }

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;