const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { verifyToken, requireRole } = require('../middleware/auth');
const uploadService = require('../services/uploadService');

const prisma = new PrismaClient();
const router = express.Router();

// GET /venue/profile - get current provider venue
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const venue = await prisma.venue.findFirst({
      where: { ownerId: req.user.id }
    });

    if (!venue) {
      return res.status(404).json({ error: 'Venue not found' });
    }

    res.json(venue);
  } catch (error) {
    console.error('Error fetching venue profile:', error);
    res.status(500).json({ error: 'Failed to fetch venue profile' });
  }
});

// PUT /venue/profile - update current provider venue
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const venue = await prisma.venue.findFirst({
      where: { ownerId: req.user.id }
    });

    if (!venue) {
      return res.status(404).json({ error: 'Venue not found' });
    }

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
      amenities,
      active,
    } = req.body;

    const updatedVenue = await prisma.venue.update({
      where: { id: venue.id },
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
        amenities,
        active,
      }
    });

    res.json(updatedVenue);
  } catch (error) {
    console.error('Error updating venue profile:', error);
    res.status(500).json({ error: 'Failed to update venue profile' });
  }
});

// POST /venue/cover-photo - upload venue cover photo
router.post('/cover-photo', verifyToken, async (req, res) => {
  try {
    const { imageBase64 } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 is required' });
    }

    const venue = await prisma.venue.findFirst({
      where: { ownerId: req.user.id }
    });

    if (!venue) {
      return res.status(404).json({ error: 'Venue not found' });
    }

    const base64Data = imageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    const uploadResult = await uploadService.uploadVenuePhoto(buffer, venue.id);
    if (!uploadResult || !uploadResult.secure_url) {
      return res.status(500).json({ error: 'Failed to upload photo' });
    }

    const updatedVenue = await prisma.venue.update({
      where: { id: venue.id },
      data: {
        coverPhoto: uploadResult.secure_url,
        photos: {
          push: [uploadResult.secure_url]
        }
      }
    });

    res.json({ data: updatedVenue, message: 'Cover photo updated successfully' });
  } catch (error) {
    console.error('Error uploading cover photo:', error);
    res.status(500).json({ error: 'Failed to upload cover photo' });
  }
});

module.exports = router;
