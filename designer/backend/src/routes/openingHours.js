const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { verifyToken, requireRole } = require('../middleware/auth');

const prisma = new PrismaClient();
const router = express.Router();

// GET /venues/:id/hours - Get opening hours for a venue
router.get('/venues/:id/hours', async (req, res) => {
  try {
    const { id } = req.params;
    
    const venue = await prisma.venue.findUnique({
      where: { id }
    });

    if (!venue) {
      return res.status(404).json({ error: 'Venue not found' });
    }

    const openingHours = await prisma.openingHours.findMany({
      where: { venueId: id },
      orderBy: { dayOfWeek: 'asc' }
    });

    res.json(openingHours);
  } catch (error) {
    console.error('Error fetching opening hours:', error);
    res.status(500).json({ error: 'Failed to fetch opening hours' });
  }
});

// POST /venues/:id/hours - Save opening hours for a venue (owner only)
router.post('/venues/:id/hours', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { hours } = req.body; // Array of { dayOfWeek, openTime, closeTime, isClosed }

    // Check if user owns this venue
    const venue = await prisma.venue.findUnique({
      where: { id }
    });

    if (!venue) {
      return res.status(404).json({ error: 'Venue not found' });
    }

    if (venue.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'You can only update opening hours for your own venue' });
    }

    // Delete existing opening hours
    await prisma.openingHours.deleteMany({
      where: { venueId: id }
    });

    // Create new opening hours records
    const openingHoursRecords = hours.map(h => ({
      venueId: id,
      dayOfWeek: h.dayOfWeek,
      openTime: h.openTime,
      closeTime: h.closeTime,
      isClosed: h.isClosed || false
    }));

    await prisma.openingHours.createMany({
      data: openingHoursRecords
    });

    res.json({ message: 'Opening hours updated successfully' });
  } catch (error) {
    console.error('Error updating opening hours:', error);
    res.status(500).json({ error: 'Failed to update opening hours' });
  }
});

module.exports = router;