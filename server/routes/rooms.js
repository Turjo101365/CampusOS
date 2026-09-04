import express from 'express';
import {
  getAllRooms,
  getRoomById,
  getRoomByNumber,
  createRoom,
  updateRoom,
  deleteRoom,
  bookRoom,
  cancelRoomBooking,
  checkRoomClash
} from '../db/storage.js';

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const rooms = getAllRooms(req.query);
    res.json({ success: true, data: rooms, count: rooms.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    let room = getRoomById(req.params.id);
    if (!room) {
      room = getRoomByNumber(req.params.id);
    }
    if (!room) {
      return res.status(404).json({ success: false, error: 'Room not found' });
    }
    res.json({ success: true, data: room });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { room_number, type, capacity } = req.body;
    if (!room_number || !type || !capacity) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: room_number, type, capacity'
      });
    }
    const created = createRoom(req.body);
    res.status(201).json({ success: true, data: created, message: 'Room created successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const updated = updateRoom(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Room not found' });
    }
    res.json({ success: true, data: updated, message: 'Room updated successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const deleted = deleteRoom(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Room not found' });
    }
    res.json({ success: true, message: 'Room deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Extra Action: Book a room
router.post('/:roomNumber/book', (req, res) => {
  try {
    const { roomNumber } = req.params;
    const { date, start_time, end_time, booked_by, purpose } = req.body;

    if (!date || !start_time || !end_time) {
      return res.status(400).json({
        success: false,
        error: 'date, start_time (HH:MM), and end_time (HH:MM) are required.'
      });
    }

    const result = bookRoom(roomNumber, {
      date,
      start_time,
      end_time,
      booked_by: booked_by || 'Student',
      purpose: purpose || 'Academic Discussion'
    });

    res.status(201).json({
      success: true,
      data: result.room,
      booking: result.booking,
      message: `Room ${roomNumber} booked successfully for ${date} from ${start_time} to ${end_time}.`
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Extra Action: Cancel a room booking
router.post('/:roomNumber/cancel-booking', (req, res) => {
  try {
    const { roomNumber } = req.params;
    const { booking_id } = req.body;

    if (!booking_id) {
      return res.status(400).json({ success: false, error: 'booking_id is required.' });
    }

    const result = cancelRoomBooking(roomNumber, booking_id);
    res.json({
      success: true,
      data: result.room,
      cancelledBooking: result.cancelledBooking,
      message: `Booking ${booking_id} for Room ${roomNumber} cancelled successfully.`
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Action: Check availability
router.post('/check-availability', (req, res) => {
  try {
    const { room_number, date, start_time, end_time } = req.body;
    if (!room_number || !date || !start_time || !end_time) {
      return res.status(400).json({
        success: false,
        error: 'room_number, date, start_time, and end_time are required.'
      });
    }
    const check = checkRoomClash(room_number, date, start_time, end_time);
    res.json({
      success: true,
      available: !check.hasClash,
      reason: check.hasClash ? check.reason : `Room ${room_number} is completely available.`
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
