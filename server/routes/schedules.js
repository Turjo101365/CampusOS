import express from 'express';
import {
  getAllSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule
} from '../db/storage.js';

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const schedules = getAllSchedules(req.query);
    res.json({ success: true, data: schedules, count: schedules.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const schedule = getScheduleById(req.params.id);
    if (!schedule) {
      return res.status(404).json({ success: false, error: 'Schedule not found' });
    }
    res.json({ success: true, data: schedule });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { course, title, day, start_time, end_time, room } = req.body;
    if (!course || !title || !day || !start_time || !end_time || !room) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: course, title, day, start_time, end_time, room'
      });
    }
    const created = createSchedule(req.body);
    res.status(201).json({ success: true, data: created, message: 'Class schedule created successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const updated = updateSchedule(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Schedule not found' });
    }
    res.json({ success: true, data: updated, message: 'Class schedule updated successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const deleted = deleteSchedule(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Schedule not found' });
    }
    res.json({ success: true, message: 'Class schedule deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
