import express from 'express';
import {
  getAllEvents,
  getEventById,
  findEventByName,
  createEvent,
  updateEvent,
  deleteEvent,
  registerForEvent,
  cancelEventRegistration
} from '../db/storage.js';

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const events = getAllEvents(req.query);
    res.json({ success: true, data: events, count: events.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    let event = getEventById(req.params.id);
    if (!event) {
      event = findEventByName(req.params.id);
    }
    if (!event) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }
    res.json({ success: true, data: event });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { name, date, start_time, end_time, capacity } = req.body;
    if (!name || !date || !start_time || !end_time || !capacity) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, date, start_time, end_time, capacity'
      });
    }
    const created = createEvent(req.body);
    res.status(201).json({ success: true, data: created, message: 'Event created successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const updated = updateEvent(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }
    res.json({ success: true, data: updated, message: 'Event updated successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const deleted = deleteEvent(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }
    res.json({ success: true, message: 'Event deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Extra Action: Register a student for an event
router.post('/:id/register', (req, res) => {
  try {
    const { student_id, name } = req.body;
    if (!student_id || !name) {
      return res.status(400).json({
        success: false,
        error: 'student_id and name are required for event registration.'
      });
    }
    const result = registerForEvent(req.params.id, { student_id, name });
    res.status(201).json({
      success: true,
      data: result.event,
      registration: result.registration,
      message: `Successfully registered ${name} (${student_id}) for "${result.event.name}".`
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Extra Action: Cancel registration
router.post('/:id/cancel-registration', (req, res) => {
  try {
    const { student_id } = req.body;
    if (!student_id) {
      return res.status(400).json({ success: false, error: 'student_id is required.' });
    }
    const result = cancelEventRegistration(req.params.id, student_id);
    res.json({
      success: true,
      data: result.event,
      cancelled: result.cancelled,
      message: `Registration for student ID ${student_id} cancelled.`
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

export default router;
