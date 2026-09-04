import express from 'express';
import {
  getAllAssignments,
  getAssignmentById,
  createAssignment,
  updateAssignment,
  deleteAssignment
} from '../db/storage.js';

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const assignments = getAllAssignments(req.query);
    res.json({ success: true, data: assignments, count: assignments.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const item = getAssignmentById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Assignment not found' });
    }
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { course, title, deadline } = req.body;
    if (!course || !title || !deadline) {
      return res.status(400).json({
        success: false,
        error: 'course, title, and deadline are required.'
      });
    }
    const created = createAssignment(req.body);
    res.status(201).json({ success: true, data: created, message: 'Assignment created successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const updated = updateAssignment(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Assignment not found' });
    }
    res.json({ success: true, data: updated, message: 'Assignment updated successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const deleted = deleteAssignment(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Assignment not found' });
    }
    res.json({ success: true, message: 'Assignment deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
