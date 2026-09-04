import express from 'express';
import {
  getAllAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement
} from '../db/storage.js';

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const announcements = getAllAnnouncements(req.query);
    res.json({ success: true, data: announcements, count: announcements.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const item = getAnnouncementById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Announcement not found' });
    }
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { title, body, priority } = req.body;
    if (!title || !body) {
      return res.status(400).json({
        success: false,
        error: 'title and body are required.'
      });
    }
    const created = createAnnouncement(req.body);
    res.status(201).json({ success: true, data: created, message: 'Announcement created successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const updated = updateAnnouncement(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Announcement not found' });
    }
    res.json({ success: true, data: updated, message: 'Announcement updated successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const deleted = deleteAnnouncement(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Announcement not found' });
    }
    res.json({ success: true, message: 'Announcement deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
