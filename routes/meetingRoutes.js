const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const meetingController = require('../controllers/meetingController');

// Validate meeting (no auth required)
router.get('/:id/validate', async (req, res) => {
  try {
    const Meeting = require('../models/Meeting');
    const meeting = await Meeting.findById(req.params.id);

    if (!meeting) {
      return res.status(404).json({ success: false, error: 'Meeting not found' });
    }

    return res.status(200).json({ success: true, message: 'Meeting valid' });
  } catch (err) {
    return res.status(400).json({ success: false, error: 'Invalid meeting ID' });
  }
});

// Create new meeting
router.post('/', authMiddleware, meetingController.createMeeting);

// Get meeting by id
router.get('/:id', authMiddleware, meetingController.getMeeting);

// List meetings for logged-in user
router.get('/', authMiddleware, meetingController.listMeetings);

// Add participant
router.post('/:id/participants', authMiddleware, meetingController.addParticipant);

// Remove participant
router.delete('/:id/participants', authMiddleware, meetingController.removeParticipant);

module.exports = router;
