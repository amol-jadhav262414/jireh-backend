const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const meetingController = require('../controllers/meetingController');

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
