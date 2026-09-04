import path from 'path';
import { fileURLToPath } from 'url';
import { DatabaseSync } from 'node:sqlite';
import { runMigration } from './migrate.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STORAGE_DIR = path.resolve(__dirname, '../data');
const DB_PATH = path.join(STORAGE_DIR, 'campusos.sqlite');

let db = null;

function getDb() {
  if (!db) {
    db = new DatabaseSync(DB_PATH);
  }
  return db;
}

export function initStorage(forceReset = false) {
  runMigration(forceReset);
  getDb();
  console.log('[CampusOS Storage] SQLite relational database ready and initialized.');
}

export function resetToSeed() {
  const summary = runMigration(true);
  return { success: true, message: 'Database reset to original seed data.', summary };
}

// ==================== SCHEDULES ====================
export function getAllSchedules(filters = {}) {
  const d = getDb();
  let sql = 'SELECT * FROM schedules WHERE 1=1';
  const params = [];

  if (filters.day) {
    sql += ' AND LOWER(day) = LOWER(?)';
    params.push(filters.day);
  }
  if (filters.course) {
    sql += ' AND (LOWER(course) LIKE LOWER(?) OR LOWER(title) LIKE LOWER(?))';
    params.push(`%${filters.course}%`, `%${filters.course}%`);
  }
  if (filters.room) {
    sql += ' AND LOWER(room) = LOWER(?)';
    params.push(filters.room);
  }
  if (filters.instructor) {
    sql += ' AND LOWER(instructor) LIKE LOWER(?)';
    params.push(`%${filters.instructor}%`);
  }

  sql += ' ORDER BY day, start_time';
  return d.prepare(sql).all(...params);
}

export function getScheduleById(id) {
  const d = getDb();
  return d.prepare('SELECT * FROM schedules WHERE id = ?').get(id) || null;
}

export function createSchedule(data) {
  const d = getDb();
  const id = data.id || `sch-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`;
  const record = {
    id,
    course: data.course?.trim() || '',
    title: data.title?.trim() || '',
    day: data.day?.trim() || 'Sunday',
    start_time: data.start_time?.trim() || '08:00',
    end_time: data.end_time?.trim() || '08:50',
    room: data.room?.trim() || '',
    instructor: data.instructor?.trim() || 'TBA',
    section: data.section?.trim() || 'A'
  };

  d.prepare(`
    INSERT INTO schedules (id, course, title, day, start_time, end_time, room, instructor, section)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    record.id,
    record.course,
    record.title,
    record.day,
    record.start_time,
    record.end_time,
    record.room,
    record.instructor,
    record.section
  );
  return record;
}

export function updateSchedule(id, updates) {
  const d = getDb();
  const existing = getScheduleById(id);
  if (!existing) return null;

  const merged = { ...existing, ...updates };
  d.prepare(`
    UPDATE schedules
    SET course = ?, title = ?, day = ?, start_time = ?, end_time = ?, room = ?, instructor = ?, section = ?
    WHERE id = ?
  `).run(
    merged.course,
    merged.title,
    merged.day,
    merged.start_time,
    merged.end_time,
    merged.room,
    merged.instructor,
    merged.section,
    id
  );
  return merged;
}

export function deleteSchedule(id) {
  const d = getDb();
  const res = d.prepare('DELETE FROM schedules WHERE id = ?').run(id);
  return res.changes > 0;
}

// ==================== ROOMS & BOOKINGS ====================
export function getAllRooms(filters = {}) {
  const d = getDb();
  let sql = 'SELECT * FROM rooms WHERE 1=1';
  const params = [];

  if (filters.type) {
    sql += ' AND LOWER(type) = LOWER(?)';
    params.push(filters.type);
  }
  if (filters.min_capacity) {
    sql += ' AND capacity >= ?';
    params.push(Number(filters.min_capacity));
  }
  if (filters.floor) {
    sql += ' AND floor = ?';
    params.push(Number(filters.floor));
  }
  if (filters.status) {
    sql += ' AND LOWER(status) = LOWER(?)';
    params.push(filters.status);
  }

  sql += ' ORDER BY room_number';
  const rawRooms = d.prepare(sql).all(...params);

  // Fetch all bookings
  const bookings = d.prepare('SELECT * FROM bookings ORDER BY date, start_time').all();
  const bookingsMap = {};
  for (const b of bookings) {
    if (!bookingsMap[b.room_number]) bookingsMap[b.room_number] = [];
    bookingsMap[b.room_number].push(b);
  }

  let list = rawRooms.map(r => ({
    ...r,
    equipment: typeof r.equipment === 'string' ? JSON.parse(r.equipment) : r.equipment,
    bookings: bookingsMap[r.room_number] || []
  }));

  if (filters.equipment) {
    const requiredEq = Array.isArray(filters.equipment)
      ? filters.equipment.map(e => e.toLowerCase())
      : filters.equipment.split(',').map(e => e.trim().toLowerCase());
    list = list.filter(r =>
      requiredEq.every(req => r.equipment.some(eq => eq.toLowerCase().includes(req)))
    );
  }

  return list;
}

export function getRoomById(id) {
  const d = getDb();
  const r = d.prepare('SELECT * FROM rooms WHERE id = ?').get(id);
  if (!r) return null;
  const bookings = d.prepare('SELECT * FROM bookings WHERE room_number = ? ORDER BY date, start_time').all(r.room_number);
  return {
    ...r,
    equipment: typeof r.equipment === 'string' ? JSON.parse(r.equipment) : r.equipment,
    bookings
  };
}

export function getRoomByNumber(roomNumber) {
  const d = getDb();
  const r = d.prepare('SELECT * FROM rooms WHERE UPPER(room_number) = UPPER(?)').get(roomNumber.trim());
  if (!r) return null;
  const bookings = d.prepare('SELECT * FROM bookings WHERE UPPER(room_number) = UPPER(?) ORDER BY date, start_time').all(roomNumber.trim());
  return {
    ...r,
    equipment: typeof r.equipment === 'string' ? JSON.parse(r.equipment) : r.equipment,
    bookings
  };
}

export function createRoom(data) {
  const d = getDb();
  const id = data.id || `room-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`;
  const eq = Array.isArray(data.equipment) ? data.equipment : (data.equipment ? data.equipment.split(',').map(s => s.trim()) : []);

  d.prepare(`
    INSERT INTO rooms (id, room_number, type, capacity, equipment, floor, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    data.room_number?.trim() || '',
    data.type || 'classroom',
    Number(data.capacity) || 40,
    JSON.stringify(eq),
    Number(data.floor) || 7,
    data.status || 'available'
  );  return getRoomById(id);
}

export function updateRoom(id, updates) {
  const d = getDb();
  const existing = getRoomById(id);
  if (!existing) return null;

  const eq = updates.equipment !== undefined
    ? (Array.isArray(updates.equipment) ? updates.equipment : updates.equipment.split(',').map(s => s.trim()))
    : existing.equipment;

  const merged = { ...existing, ...updates, equipment: eq };

  d.prepare(`
    UPDATE rooms
    SET room_number = ?, type = ?, capacity = ?, equipment = ?, floor = ?, status = ?
    WHERE id = ?
  `).run(
    merged.room_number,
    merged.type,
    Number(merged.capacity),
    JSON.stringify(merged.equipment),
    Number(merged.floor),
    merged.status,
    id
  );  return getRoomById(id);
}

export function deleteRoom(id) {
  const d = getDb();
  const room = getRoomById(id);
  if (!room) return false;
  d.prepare('DELETE FROM bookings WHERE room_number = ?').run(room.room_number);
  const res = d.prepare('DELETE FROM rooms WHERE id = ?').run(id);
  return res.changes > 0;
}

function timeToMinutes(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function getDayOfWeekFromDate(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
}

export function checkRoomClash(roomNumber, date, startTime, endTime, excludeBookingId = null) {
  const room = getRoomByNumber(roomNumber);
  if (!room) {
    return { hasClash: true, reason: `Room ${roomNumber} not found.` };
  }

  const reqStart = timeToMinutes(startTime);
  const reqEnd = timeToMinutes(endTime);

  if (reqStart >= reqEnd) {
    return { hasClash: true, reason: `Start time (${startTime}) must be before end time (${endTime}).` };
  }

  // 1. Check existing room bookings in SQLite
  const conflictingBooking = (room.bookings || []).find(b => {
    if (excludeBookingId && b.booking_id === excludeBookingId) return false;
    if (b.date !== date) return false;
    const bStart = timeToMinutes(b.start_time);
    const bEnd = timeToMinutes(b.end_time);
    return !(reqEnd <= bStart || reqStart >= bEnd);
  });

  if (conflictingBooking) {
    return {
      hasClash: true,
      reason: `Clash with existing booking "${conflictingBooking.purpose}" by ${conflictingBooking.booked_by} (${conflictingBooking.start_time} - ${conflictingBooking.end_time}).`
    };
  }

  // 2. Check scheduled timetable classes on that day of week
  const dayOfWeek = getDayOfWeekFromDate(date);
  const d = getDb();
  const classes = d.prepare('SELECT * FROM schedules WHERE UPPER(room) = UPPER(?) AND LOWER(day) = LOWER(?)').all(room.room_number, dayOfWeek);

  const conflictingClass = classes.find(s => {
    const cStart = timeToMinutes(s.start_time);
    const cEnd = timeToMinutes(s.end_time);
    return !(reqEnd <= cStart || reqStart >= cEnd);
  });

  if (conflictingClass) {
    return {
      hasClash: true,
      reason: `Clash with class schedule: ${conflictingClass.course} (${conflictingClass.title}) from ${conflictingClass.start_time} to ${conflictingClass.end_time}.`
    };
  }

  return { hasClash: false, room };
}

export function bookRoom(roomNumber, bookingData) {
  const room = getRoomByNumber(roomNumber);
  if (!room) {
    throw new Error(`Room ${roomNumber} not found.`);
  }

  if (room.status !== 'available') {
    throw new Error(`Room ${roomNumber} is currently marked as unavailable.`);
  }

  const { date, start_time, end_time, booked_by, purpose } = bookingData;
  if (!date || !start_time || !end_time) {
    throw new Error('Date, start time, and end time are required.');
  }

  const clash = checkRoomClash(roomNumber, date, start_time, end_time);
  if (clash.hasClash) {
    throw new Error(clash.reason);
  }

  const bookingId = `bk-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`;
  const newBooking = {
    booking_id: bookingId,
    room_number: room.room_number,
    booked_by: booked_by || 'Student',
    date,
    start_time,
    end_time,
    purpose: purpose || 'Academic Discussion'
  };

  const d = getDb();
  d.prepare(`
    INSERT INTO bookings (booking_id, room_number, booked_by, date, start_time, end_time, purpose)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    newBooking.booking_id,
    newBooking.room_number,
    newBooking.booked_by,
    newBooking.date,
    newBooking.start_time,
    newBooking.end_time,
    newBooking.purpose
  );
  return { room: getRoomByNumber(roomNumber), booking: newBooking };
}

export function cancelRoomBooking(roomNumberOrId, bookingId) {
  let room = getRoomById(roomNumberOrId) || getRoomByNumber(roomNumberOrId);
  if (!room) {
    throw new Error(`Room ${roomNumberOrId} not found.`);
  }

  const d = getDb();
  const existing = d.prepare('SELECT * FROM bookings WHERE booking_id = ?').get(bookingId);
  if (!existing) {
    throw new Error(`Booking ID ${bookingId} not found.`);
  }

  d.prepare('DELETE FROM bookings WHERE booking_id = ?').run(bookingId);
  return { room: getRoomByNumber(room.room_number), cancelledBooking: existing };
}

// ==================== EVENTS & REGISTRATIONS ====================
export function getAllEvents(filters = {}) {
  const d = getDb();
  let sql = 'SELECT * FROM events WHERE 1=1';
  const params = [];

  if (filters.status) {
    sql += ' AND LOWER(status) = LOWER(?)';
    params.push(filters.status);
  }
  if (filters.organizer) {
    sql += ' AND LOWER(organizer) LIKE LOWER(?)';
    params.push(`%${filters.organizer}%`);
  }
  if (filters.date) {
    sql += ' AND date = ?';
    params.push(filters.date);
  }

  sql += ' ORDER BY date, start_time';
  const events = d.prepare(sql).all(...params);

  // Fetch registrations
  const regs = d.prepare('SELECT * FROM registrations').all();
  const regMap = {};
  for (const r of regs) {
    if (!regMap[r.event_id]) regMap[r.event_id] = [];
    regMap[r.event_id].push({ student_id: r.student_id, name: r.name });
  }

  return events.map(e => ({
    ...e,
    registrations: regMap[e.id] || []
  }));
}

export function getEventById(id) {
  const d = getDb();
  const e = d.prepare('SELECT * FROM events WHERE id = ?').get(id);
  if (!e) return null;
  const registrations = d.prepare('SELECT student_id, name FROM registrations WHERE event_id = ?').all(id);
  return {
    ...e,
    registrations
  };
}

export function findEventByName(nameQuery) {
  const d = getDb();
  const q = `%${nameQuery.trim().toLowerCase()}%`;
  const e = d.prepare('SELECT * FROM events WHERE LOWER(name) LIKE ? OR LOWER(id) = ?').get(q, nameQuery.trim().toLowerCase());
  if (!e) return null;
  return getEventById(e.id);
}

export function createEvent(data) {
  const d = getDb();
  const id = data.id || `evt-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`;

  d.prepare(`
    INSERT INTO events (id, name, description, date, start_time, end_time, end_date, venue, organizer, capacity, registered, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    data.name?.trim() || '',
    data.description?.trim() || '',
    data.date || '',
    data.start_time || '10:00',
    data.end_time || '12:00',
    data.end_date || data.date || '',
    data.venue?.trim() || '7C01',
    data.organizer?.trim() || 'CSE Department',
    Number(data.capacity) || 50,
    Number(data.registered) || 0,
    data.status || 'upcoming'
  );  return getEventById(id);
}

export function updateEvent(id, updates) {
  const d = getDb();
  const existing = getEventById(id);
  if (!existing) return null;

  const merged = { ...existing, ...updates };
  d.prepare(`
    UPDATE events
    SET name = ?, description = ?, date = ?, start_time = ?, end_time = ?, end_date = ?, venue = ?, organizer = ?, capacity = ?, registered = ?, status = ?
    WHERE id = ?
  `).run(
    merged.name,
    merged.description,
    merged.date,
    merged.start_time,
    merged.end_time,
    merged.end_date,
    merged.venue,
    merged.organizer,
    Number(merged.capacity),
    Number(merged.registered),
    merged.status,
    id
  );  return getEventById(id);
}

export function deleteEvent(id) {
  const d = getDb();
  d.prepare('DELETE FROM registrations WHERE event_id = ?').run(id);
  const res = d.prepare('DELETE FROM events WHERE id = ?').run(id);
  return res.changes > 0;
}

export function registerForEvent(eventIdOrName, studentInfo) {
  let event = getEventById(eventIdOrName) || findEventByName(eventIdOrName);
  if (!event) {
    throw new Error(`Event "${eventIdOrName}" not found.`);
  }

  if (event.status === 'cancelled') {
    throw new Error(`Event "${event.name}" has been cancelled.`);
  }
  if (event.status === 'completed') {
    throw new Error(`Event "${event.name}" is already completed.`);
  }

  const student_id = studentInfo.student_id?.trim() || '20-40532';
  const name = studentInfo.name?.trim() || 'Current Student';

  const d = getDb();
  const existing = d.prepare('SELECT * FROM registrations WHERE event_id = ? AND student_id = ?').get(event.id, student_id);
  if (existing) {
    throw new Error(`Student ${name} (${student_id}) is already registered for this event.`);
  }

  if (event.registered >= event.capacity) {
    d.prepare("UPDATE events SET status = 'full' WHERE id = ?").run(event.id);
    throw new Error(`Event "${event.name}" is at maximum capacity (${event.capacity}/${event.capacity}).`);
  }

  d.prepare('INSERT INTO registrations (event_id, student_id, name) VALUES (?, ?, ?)').run(event.id, student_id, name);

  const newRegistered = event.registered + 1;
  const newStatus = newRegistered >= event.capacity ? 'full' : event.status;
  d.prepare('UPDATE events SET registered = ?, status = ? WHERE id = ?').run(newRegistered, newStatus, event.id);
  return { event: getEventById(event.id), registration: { student_id, name } };
}

export function cancelEventRegistration(eventIdOrName, studentId) {
  let event = getEventById(eventIdOrName) || findEventByName(eventIdOrName);
  if (!event) {
    throw new Error(`Event "${eventIdOrName}" not found.`);
  }

  const d = getDb();
  const existing = d.prepare('SELECT * FROM registrations WHERE event_id = ? AND student_id = ?').get(event.id, studentId);
  if (!existing) {
    throw new Error(`Registration for student ID ${studentId} not found in event "${event.name}".`);
  }

  d.prepare('DELETE FROM registrations WHERE event_id = ? AND student_id = ?').run(event.id, studentId);

  const newRegistered = Math.max(0, event.registered - 1);
  const newStatus = event.status === 'full' && newRegistered < event.capacity ? 'upcoming' : event.status;
  d.prepare('UPDATE events SET registered = ?, status = ? WHERE id = ?').run(newRegistered, newStatus, event.id);
  return { event: getEventById(event.id), cancelled: existing };
}

// ==================== ANNOUNCEMENTS ====================
export function getAllAnnouncements(filters = {}) {
  const d = getDb();
  let sql = 'SELECT * FROM announcements WHERE 1=1';
  const params = [];

  if (filters.priority) {
    sql += ' AND LOWER(priority) = LOWER(?)';
    params.push(filters.priority);
  }
  if (filters.active_only) {
    sql += ' AND expires >= ?';
    params.push('2026-09-04');
  }

  sql += ' ORDER BY date DESC, id DESC';
  return d.prepare(sql).all(...params);
}

export function getAnnouncementById(id) {
  const d = getDb();
  return d.prepare('SELECT * FROM announcements WHERE id = ?').get(id) || null;
}

export function createAnnouncement(data) {
  const d = getDb();
  const id = data.id || `ann-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`;

  d.prepare(`
    INSERT INTO announcements (id, title, body, date, priority, posted_by, expires)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    data.title?.trim() || '',
    data.body?.trim() || '',
    data.date || '2026-09-04',
    data.priority || 'medium',
    data.posted_by?.trim() || 'Department Office',
    data.expires || '2026-09-30'
  );  return getAnnouncementById(id);
}

export function updateAnnouncement(id, updates) {
  const d = getDb();
  const existing = getAnnouncementById(id);
  if (!existing) return null;

  const merged = { ...existing, ...updates };
  d.prepare(`
    UPDATE announcements
    SET title = ?, body = ?, date = ?, priority = ?, posted_by = ?, expires = ?
    WHERE id = ?
  `).run(
    merged.title,
    merged.body,
    merged.date,
    merged.priority,
    merged.posted_by,
    merged.expires,
    id
  );  return getAnnouncementById(id);
}

export function deleteAnnouncement(id) {
  const d = getDb();
  const res = d.prepare('DELETE FROM announcements WHERE id = ?').run(id);
  return res.changes > 0;
}

// ==================== ASSIGNMENTS ====================
export function getAllAssignments(filters = {}) {
  const d = getDb();
  let sql = 'SELECT * FROM assignments WHERE 1=1';
  const params = [];

  if (filters.status) {
    sql += ' AND LOWER(status) = LOWER(?)';
    params.push(filters.status);
  }
  if (filters.course) {
    sql += ' AND (LOWER(course) LIKE LOWER(?) OR LOWER(course_title) LIKE LOWER(?))';
    params.push(`%${filters.course}%`, `%${filters.course}%`);
  }

  sql += ' ORDER BY deadline ASC';
  return d.prepare(sql).all(...params);
}

export function getAssignmentById(id) {
  const d = getDb();
  return d.prepare('SELECT * FROM assignments WHERE id = ?').get(id) || null;
}

export function createAssignment(data) {
  const d = getDb();
  const id = data.id || `asgn-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`;

  d.prepare(`
    INSERT INTO assignments (id, course, course_title, title, description, assigned_date, deadline, submission_platform, status, marks)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    data.course?.trim() || '',
    data.course_title?.trim() || '',
    data.title?.trim() || '',
    data.description?.trim() || '',
    data.assigned_date || '2026-09-04',
    data.deadline || '',
    data.submission_platform || 'Google Classroom',
    data.status || 'pending',
    Number(data.marks) || 10
  );  return getAssignmentById(id);
}

export function updateAssignment(id, updates) {
  const d = getDb();
  const existing = getAssignmentById(id);
  if (!existing) return null;

  const merged = { ...existing, ...updates };
  d.prepare(`
    UPDATE assignments
    SET course = ?, course_title = ?, title = ?, description = ?, assigned_date = ?, deadline = ?, submission_platform = ?, status = ?, marks = ?
    WHERE id = ?
  `).run(
    merged.course,
    merged.course_title,
    merged.title,
    merged.description,
    merged.assigned_date,
    merged.deadline,
    merged.submission_platform,
    merged.status,
    Number(merged.marks),
    id
  );  return getAssignmentById(id);
}

export function deleteAssignment(id) {
  const d = getDb();
  const res = d.prepare('DELETE FROM assignments WHERE id = ?').run(id);
  return res.changes > 0;
}

// ==================== STATS ====================
export function getStats() {
  const d = getDb();
  return {
    counts: {
      schedules: d.prepare('SELECT COUNT(*) as count FROM schedules').get().count,
      rooms: d.prepare('SELECT COUNT(*) as count FROM rooms').get().count,
      events: d.prepare('SELECT COUNT(*) as count FROM events').get().count,
      announcements: d.prepare('SELECT COUNT(*) as count FROM announcements').get().count,
      assignments: d.prepare('SELECT COUNT(*) as count FROM assignments').get().count
    },
    highPriorityAnnouncements: d.prepare("SELECT COUNT(*) as count FROM announcements WHERE LOWER(priority) = 'high'").get().count,
    pendingAssignments: d.prepare("SELECT COUNT(*) as count FROM assignments WHERE LOWER(status) = 'pending'").get().count,
    upcomingEvents: d.prepare("SELECT COUNT(*) as count FROM events WHERE LOWER(status) = 'upcoming'").get().count,
    availableRooms: d.prepare("SELECT COUNT(*) as count FROM rooms WHERE LOWER(status) = 'available'").get().count
  };
}
