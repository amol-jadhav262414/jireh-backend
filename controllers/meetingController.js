const Meeting = require('../models/Meeting');

exports.createMeeting = async (req, res) => {
  try {
    const { title, scheduledAt } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }

    const meeting = await Meeting.create({
      title,
      host: req.user._id,
      scheduledAt: scheduledAt || Date.now(),
      participants: [req.user._id]
    });

    res.status(201).json({ success: true, meeting });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id).populate('host', 'name email').populate('participants', 'name email');
    if (!meeting) {
      return res.status(404).json({ success: false, message: 'Meeting not found' });
    }
    res.json({ success: true, meeting });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.listMeetings = async (req, res) => {
  try {
    const meetings = await Meeting.find({ participants: req.user._id }).populate('host', 'name email');
    res.json({ success: true, meetings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
exports.addParticipant = async (req, res) => {
  try {
    const meetingId = req.params.id;
    const { participantEmail } = req.body;

    if (!participantEmail) {
      return res.status(400).json({ success: false, message: 'Participant email is required' });
    }

    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
      return res.status(404).json({ success: false, message: 'Meeting not found' });
    }

    // Only host can add participants
    if (meeting.host.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only host can add participants' });
    }

    // Find user by email
    const userToAdd = await User.findOne({ email: participantEmail });
    if (!userToAdd) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if already participant
    if (meeting.participants.includes(userToAdd._id)) {
      return res.status(400).json({ success: false, message: 'User already a participant' });
    }

    meeting.participants.push(userToAdd._id);
    await meeting.save();

    res.json({ success: true, message: 'Participant added', meeting });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.removeParticipant = async (req, res) => {
  try {
    const meetingId = req.params.id;
    const { participantEmail } = req.body;

    if (!participantEmail) {
      return res.status(400).json({ success: false, message: 'Participant email is required' });
    }

    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
      return res.status(404).json({ success: false, message: 'Meeting not found' });
    }

    // Only host can remove participants
    if (meeting.host.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only host can remove participants' });
    }

    const userToRemove = await User.findOne({ email: participantEmail });
    if (!userToRemove) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if participant exists
    if (!meeting.participants.includes(userToRemove._id)) {
      return res.status(400).json({ success: false, message: 'User is not a participant' });
    }

    meeting.participants = meeting.participants.filter(
      (id) => id.toString() !== userToRemove._id.toString()
    );
    await meeting.save();

    res.json({ success: true, message: 'Participant removed', meeting });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
