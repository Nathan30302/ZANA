const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { verifyToken, requireRole } = require('../middleware/auth');
const { validateStaff } = require('../middleware/validation');

const prisma = new PrismaClient();
const router = express.Router();

// GET /venues/:id/staff - List venue staff
router.get('/venues/:id/staff', async (req, res) => {
  try {
    const { id } = req.params;
    
    const venue = await prisma.venue.findUnique({
      where: { id }
    });

    if (!venue) {
      return res.status(404).json({ error: 'Venue not found' });
    }

    const staff = await prisma.staff.findMany({
      where: { 
        venueId: id,
        isActive: true
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            email: true,
            phone: true
          }
        }
      }
    });

    res.json(staff);
  } catch (error) {
    console.error('Error fetching venue staff:', error);
    res.status(500).json({ error: 'Failed to fetch venue staff' });
  }
});

// POST /venues/:id/staff/invite - Invite staff by email/phone (owner only)
router.post('/venues/:id/staff/invite', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { email, phone, title } = req.body;

    // Check if user owns this venue
    const venue = await prisma.venue.findUnique({
      where: { id }
    });

    if (!venue) {
      return res.status(404).json({ error: 'Venue not found' });
    }

    if (venue.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'You can only invite staff to your own venue' });
    }

    // Check if user exists with email or phone
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { phone }
        ]
      }
    });

    // If user doesn't exist, create one
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          phone,
          password: Math.random().toString(36).slice(-8), // Temporary password
          firstName: email.split('@')[0], // Use email prefix as first name
          lastName: '',
          role: 'STAFF'
        }
      });
    }

    // Check if staff member already exists
    const existingStaff = await prisma.staff.findFirst({
      where: {
        userId: user.id,
        venueId: id
      }
    });

    if (existingStaff) {
      return res.status(400).json({ error: 'This user is already a staff member at this venue' });
    }

    // Create staff member
    const staff = await prisma.staff.create({
      data: {
        userId: user.id,
        venueId: id,
        title,
        isActive: true
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            email: true,
            phone: true
          }
        }
      }
    });

    res.status(201).json(staff);
  } catch (error) {
    console.error('Error inviting staff:', error);
    res.status(500).json({ error: 'Failed to invite staff' });
  }
});

// POST /staff/accept-invite - Staff accepts invite, sets up account
router.post('/accept-invite', verifyToken, async (req, res) => {
  try {
    const { staffId, title } = req.body;

    // Find staff member
    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
      include: {
        user: true
      }
    });

    if (!staff) {
      return res.status(404).json({ error: 'Staff invitation not found' });
    }

    // Check if this is the correct user
    if (staff.userId !== req.user.id) {
      return res.status(403).json({ error: 'This invitation is not for you' });
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        firstName: req.body.firstName || req.user.firstName,
        lastName: req.body.lastName || req.user.lastName,
        avatarUrl: req.body.avatarUrl || req.user.avatarUrl
      }
    });

    // Update staff title if provided
    if (title) {
      await prisma.staff.update({
        where: { id: staffId },
        data: { title }
      });
    }

    res.json({
      message: 'Invitation accepted successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    res.status(500).json({ error: 'Failed to accept invitation' });
  }
});

// PUT /staff/:id/availability - Set weekly availability
router.put('/:id/availability', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { availability } = req.body; // Array of { dayOfWeek, startTime, endTime, isBlocked }

    // Check if user owns this staff profile
    const staff = await prisma.staff.findUnique({
      where: { id },
      include: {
        user: true,
        venue: true
      }
    });

    if (!staff) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    // Check if user is the staff member or the venue owner
    if (staff.userId !== req.user.id && staff.venue.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'You can only update your own availability' });
    }

    // Delete existing availability
    await prisma.availability.deleteMany({
      where: { staffId: id }
    });

    // Create new availability records
    const availabilityRecords = availability.map(a => ({
      staffId: id,
      dayOfWeek: a.dayOfWeek,
      startTime: a.startTime,
      endTime: a.endTime,
      isBlocked: a.isBlocked || false
    }));

    await prisma.availability.createMany({
      data: availabilityRecords
    });

    res.json({ message: 'Availability updated successfully' });
  } catch (error) {
    console.error('Error updating availability:', error);
    res.status(500).json({ error: 'Failed to update availability' });
  }
});

// DELETE /venues/:venueId/staff/:staffId - Remove staff member (owner only)
router.delete('/venues/:venueId/staff/:staffId', verifyToken, async (req, res) => {
  try {
    const { venueId, staffId } = req.params;

    // Check if user owns this venue
    const venue = await prisma.venue.findUnique({
      where: { id: venueId }
    });

    if (!venue) {
      return res.status(404).json({ error: 'Venue not found' });
    }

    if (venue.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'You can only remove staff from your own venue' });
    }

    // Check if staff belongs to this venue
    const staff = await prisma.staff.findUnique({
      where: { id: staffId }
    });

    if (!staff || staff.venueId !== venueId) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    // Deactivate staff member (soft delete)
    await prisma.staff.update({
      where: { id: staffId },
      data: { isActive: false }
    });

    res.json({ message: 'Staff member removed successfully' });
  } catch (error) {
    console.error('Error removing staff:', error);
    res.status(500).json({ error: 'Failed to remove staff' });
  }
});

module.exports = router;