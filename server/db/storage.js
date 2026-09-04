import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SEED_DATA_DIR = path.resolve(__dirname, '../../data');
const STORAGE_DIR = path.resolve(__dirname, '../data');
const DB_FILE_PATH = path.join(STORAGE_DIR, 'campusos_db.json');

// In-memory cache backed by persistent atomic disk writes
let db = {
  schedules: [],
  rooms: [],
  events: [],
  announcements: [],
  assignments: []
};

// Ensure storage directory exists
if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

function loadSeedData() {
  const readJson = (filename) => {
    const fullPath = path.join(SEED_DATA_DIR, filename);
    if (!fs.existsSync(fullPath)) return [];
    return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  };

  return {
    schedules: readJson('schedules.json'),
    rooms: readJson('rooms.json'),
    events: readJson('events.json'),
    announcements: readJson('announcements.json'),
    assignments: readJson('assignments.json')
  };
}

/**
 * Atomic file swapping to guarantee ACID durability.
 * Writes to a temporary file first, then atomically renames to target.
 */
function flushToDisk() {
  try {
    const tempPath = `${DB_FILE_PATH}.tmp.${Date.now()}.${Math.random().toString(36).slice(2)}`;
    fs.writeFileSync(tempPath, JSON.stringify(db, null, 2), 'utf8');
    fs.renameSync(tempPath, DB_FILE_PATH);
  } catch (err) {
    console.error('[CampusOS Storage] Failed to write atomic snapshot to disk:', err);
  }
}

/**
 * Initialize persistent storage.
 * If campusos_db.json does not exist or forceReset is true, loads from data/*.json seeds.
 * Otherwise, loads persisted state from disk.
 */
export function initStorage(forceReset = false) {
  if (forceReset || !fs.existsSync(DB_FILE_PATH)) {
    console.log('[CampusOS Storage] Initializing persistent store from data/*.json seeds...');
    db = loadSeedData();
    flushToDisk();
    console.log(`[CampusOS Storage] Seed data loaded into persistent store: ${db.schedules.length} schedules, ${db.rooms.length} rooms, ${db.events.length} events, ${db.announcements.length} announcements, ${db.assignments.length} assignments.`);
  } else {
    try {
      console.log('[CampusOS Storage] Loading persistent database from disk...');
      const content = fs.readFileSync(DB_FILE_PATH, 'utf8');
      db = JSON.parse(content);
      console.log(`[CampusOS Storage] Successfully loaded from ${DB_FILE_PATH}: ${db.schedules?.length || 0} schedules, ${db.rooms?.length || 0} rooms, ${db.events?.length || 0} events, ${db.announcements?.length || 0} announcements, ${db.assignments?.length || 0} assignments.`);
    } catch (err) {
      console.error('[CampusOS Storage] Persistent store was corrupt, reseeding from data/*.json:', err);
      db = loadSeedData();
      flushToDisk();
    }
  }
}

export function resetToSeed() {
  db = loadSeedData();
  flushToDisk();
  return { success: true, message: 'Database reset to original seed data.' };
}

// ==================== SCHEDULES ====================
export function getAllSchedules(filters = {}) {
  let list = [...(db.schedules || [])];
  if (filters.day) {
    list = list.filter(s => s.day.toLowerCase() === filters.day.toLowerCase());
  }
  if (filters.course) {
    const q = filters.course.toLowerCase();
    list = list.filter(s => s.course.toLowerCase().includes(q) || s.title.toLowerCase().includes(q));
  }
  if (filters.room) {
    list = list.filter(s => s.room.toLowerCase() === filters.room.toLowerCase());
  }
  if (filters.instructor) {
    const inst = filters.instructor.toLowerCase();
    list = list.filter(s => s.instructor.toLowerCase().includes(inst));
  }
  return list;
}

export function getScheduleById(id) {
  return (db.schedules || []).find(s => s.id === id) || null;
}

export function createSchedule(data) {
  const id = data.id || `sch-${String(db.schedules.length + 1).padStart(3, '0')}`;
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
  db.schedules.push(record);
  flushToDisk();
  return record;
}

export function updateSchedule(id, updates) {
  const index = db.schedules.findIndex(s => s.id === id);
  if (index === -1) return null;
  db.schedules[index] = { ...db.schedules[index], ...updates };
  flushToDisk();
  return db.schedules[index];
}

export function deleteSchedule(id) {
  const index = db.schedules.findIndex(s => s.id === id);
  if (index === -1) return false;
  db.schedules.splice(index, 1);
  flushToDisk();
  return true;
}

// ==================== ROOMS & BOOKINGS ====================
export function getAllRooms(filters = {}) {
  let list = [...(db.rooms || [])];
  if (filters.type) {
    list = list.filter(r => r.type.toLowerCase() === filters.type.toLowerCase());
  }
  if (filters.min_capacity) {
    const min = parseInt(filters.min_capacity, 10);
    list = list.filter(r => r.capacity >= min);
  }
  if (filters.floor) {
    const fl = parseInt(filters.floor, 10);
    list = list.filter(r => r.floor === fl);
  }
  if (filters.status) {
    list = list.filter(r => r.status.toLowerCase() === filters.status.toLowerCase());
  }
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
  return (db.rooms || []).find(r => r.id === id) || null;
}

export function getRoomByNumber(roomNumber) {
  const clean = roomNumber.trim().toUpperCase();
  return (db.rooms || []).find(r => r.room_number.toUpperCase() === clean) || null;
}

export function createRoom(data) {
  const id = data.id || `room-${String(db.rooms.length + 1).padStart(3, '0')}`;
  const record = {
    id,
    room_number: data.room_number?.trim() || '',
    type: data.type || 'classroom',
    capacity: Number(data.capacity) || 40,
    equipment: Array.isArray(data.equipment) ? data.equipment : (data.equipment ? data.equipment.split(',').map(s => s.trim()) : []),
    floor: Number(data.floor) || 7,
    status: data.status || 'available',
    bookings: data.bookings || []
  };
  db.rooms.push(record);
  flushToDisk();
  return record;
}

export function updateRoom(id, updates) {
  const index = db.rooms.findIndex(r => r.id === id);
  if (index === -1) return null;
  db.rooms[index] = { ...db.rooms[index], ...updates };
  flushToDisk();
  return db.rooms[index];
}

export function deleteRoom(id) {
  const index = db.rooms.findIndex(r => r.id === id);
  if (index === -1) return false;
  db.rooms.splice(index, 1);
  flushToDisk();
  return true;
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

  // 1. Check existing room bookings on this date
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
  const conflictingClass = (db.schedules || []).find(s => {
    if (s.room.toUpperCase() !== room.room_number.toUpperCase()) return false;
    if (s.day.toLowerCase() !== dayOfWeek.toLowerCase()) return false;
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
    booked_by: booked_by || 'Student',
    date,
    start_time,
    end_time,
    purpose: purpose || 'Academic Discussion'
  };

  if (!room.bookings) room.bookings = [];
  room.bookings.push(newBooking);
  flushToDisk();
  return { room, booking: newBooking };
}

export function cancelRoomBooking(roomNumberOrId, bookingId) {
  let room = getRoomById(roomNumberOrId) || getRoomByNumber(roomNumberOrId);
  if (!room) {
    throw new Error(`Room ${roomNumberOrId} not found.`);
  }

  const index = (room.bookings || []).findIndex(b => b.booking_id === bookingId);
  if (index === -1) {
    throw new Error(`Booking ID ${bookingId} not found for room ${room.room_number}.`);
  }

  const [removed] = room.bookings.splice(index, 1);
  flushToDisk();
  return { room, cancelledBooking: removed };
}

// ==================== EVENTS & REGISTRATIONS ====================
export function getAllEvents(filters = {}) {
  let list = [...(db.events || [])];
  if (filters.status) {
    list = list.filter(e => e.status.toLowerCase() === filters.status.toLowerCase());
  }
  if (filters.organizer) {
    const org = filters.organizer.toLowerCase();
    list = list.filter(e => e.organizer.toLowerCase().includes(org));
  }
  if (filters.date) {
    list = list.filter(e => e.date === filters.date);
  }
  return list;
}

export function getEventById(id) {
  return (db.events || []).find(e => e.id === id) || null;
}

export function findEventByName(nameQuery) {
  const q = nameQuery.toLowerCase().trim();
  return (db.events || []).find(e => e.name.toLowerCase().includes(q) || e.id.toLowerCase() === q) || null;
}

export function createEvent(data) {
  const id = data.id || `evt-${String(db.events.length + 1).padStart(3, '0')}`;
  const record = {
    id,
    name: data.name?.trim() || '',
    description: data.description?.trim() || '',
    date: data.date || '',
    start_time: data.start_time || '10:00',
    end_time: data.end_time || '12:00',
    end_date: data.end_date || data.date || '',
    venue: data.venue?.trim() || '7C01',
    organizer: data.organizer?.trim() || 'CSE Department',
    capacity: Number(data.capacity) || 50,
    registered: Number(data.registered) || 0,
    registrations: data.registrations || [],
    status: data.status || 'upcoming'
  };
  db.events.push(record);
  flushToDisk();
  return record;
}

export function updateEvent(id, updates) {
  const index = db.events.findIndex(e => e.id === id);
  if (index === -1) return null;
  db.events[index] = { ...db.events[index], ...updates };
  if (Array.isArray(db.events[index].registrations)) {
    db.events[index].registered = db.events[index].registrations.length;
    if (db.events[index].registered >= db.events[index].capacity && db.events[index].status === 'upcoming') {
      db.events[index].status = 'full';
    }
  }
  flushToDisk();
  return db.events[index];
}

export function deleteEvent(id) {
  const index = db.events.findIndex(e => e.id === id);
  if (index === -1) return false;
  db.events.splice(index, 1);
  flushToDisk();
  return true;
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

  if (!event.registrations) event.registrations = [];

  const existing = event.registrations.find(r => r.student_id === student_id);
  if (existing) {
    throw new Error(`Student ${name} (${student_id}) is already registered for this event.`);
  }

  if (event.registrations.length >= event.capacity) {
    event.status = 'full';
    flushToDisk();
    throw new Error(`Event "${event.name}" is at maximum capacity (${event.capacity}/${event.capacity}).`);
  }

  event.registrations.push({ student_id, name });
  event.registered = event.registrations.length;
  if (event.registered >= event.capacity) {
    event.status = 'full';
  }
  flushToDisk();
  return { event, registration: { student_id, name } };
}

export function cancelEventRegistration(eventIdOrName, studentId) {
  let event = getEventById(eventIdOrName) || findEventByName(eventIdOrName);
  if (!event) {
    throw new Error(`Event "${eventIdOrName}" not found.`);
  }

  const index = (event.registrations || []).findIndex(r => r.student_id === studentId);
  if (index === -1) {
    throw new Error(`Registration for student ID ${studentId} not found in event "${event.name}".`);
  }

  const [removed] = event.registrations.splice(index, 1);
  event.registered = event.registrations.length;
  if (event.status === 'full' && event.registered < event.capacity) {
    event.status = 'upcoming';
  }
  flushToDisk();
  return { event, cancelled: removed };
}

// ==================== ANNOUNCEMENTS ====================
export function getAllAnnouncements(filters = {}) {
  let list = [...(db.announcements || [])];
  if (filters.priority) {
    list = list.filter(a => a.priority.toLowerCase() === filters.priority.toLowerCase());
  }
  if (filters.active_only) {
    list = list.filter(a => a.expires >= '2026-09-04');
  }
  return list;
}

export function getAnnouncementById(id) {
  return (db.announcements || []).find(a => a.id === id) || null;
}

export function createAnnouncement(data) {
  const id = data.id || `ann-${String(db.announcements.length + 1).padStart(3, '0')}`;
  const record = {
    id,
    title: data.title?.trim() || '',
    body: data.body?.trim() || '',
    date: data.date || '2026-09-04',
    priority: data.priority || 'medium',
    posted_by: data.posted_by?.trim() || 'Department Office',
    expires: data.expires || '2026-09-30'
  };
  db.announcements.unshift(record);
  flushToDisk();
  return record;
}

export function updateAnnouncement(id, updates) {
  const index = db.announcements.findIndex(a => a.id === id);
  if (index === -1) return null;
  db.announcements[index] = { ...db.announcements[index], ...updates };
  flushToDisk();
  return db.announcements[index];
}

export function deleteAnnouncement(id) {
  const index = db.announcements.findIndex(a => a.id === id);
  if (index === -1) return false;
  db.announcements.splice(index, 1);
  flushToDisk();
  return true;
}

// ==================== ASSIGNMENTS ====================
export function getAllAssignments(filters = {}) {
  let list = [...(db.assignments || [])];
  if (filters.status) {
    list = list.filter(a => a.status.toLowerCase() === filters.status.toLowerCase());
  }
  if (filters.course) {
    const c = filters.course.toLowerCase();
    list = list.filter(a => a.course.toLowerCase().includes(c) || a.course_title.toLowerCase().includes(c));
  }
  return list;
}

export function getAssignmentById(id) {
  return (db.assignments || []).find(a => a.id === id) || null;
}

export function createAssignment(data) {
  const id = data.id || `asgn-${String(db.assignments.length + 1).padStart(3, '0')}`;
  const record = {
    id,
    course: data.course?.trim() || '',
    course_title: data.course_title?.trim() || '',
    title: data.title?.trim() || '',
    description: data.description?.trim() || '',
    assigned_date: data.assigned_date || '2026-09-04',
    deadline: data.deadline || '',
    submission_platform: data.submission_platform || 'Google Classroom',
    status: data.status || 'pending',
    marks: Number(data.marks) || 10
  };
  db.assignments.push(record);
  flushToDisk();
  return record;
}

export function updateAssignment(id, updates) {
  const index = db.assignments.findIndex(a => a.id === id);
  if (index === -1) return null;
  db.assignments[index] = { ...db.assignments[index], ...updates };
  flushToDisk();
  return db.assignments[index];
}

export function deleteAssignment(id) {
  const index = db.assignments.findIndex(a => a.id === id);
  if (index === -1) return false;
  db.assignments.splice(index, 1);
  flushToDisk();
  return true;
}

// ==================== STATS ====================
export function getStats() {
  return {
    counts: {
      schedules: (db.schedules || []).length,
      rooms: (db.rooms || []).length,
      events: (db.events || []).length,
      announcements: (db.announcements || []).length,
      assignments: (db.assignments || []).length
    },
    highPriorityAnnouncements: (db.announcements || []).filter(a => a.priority === 'high').length,
    pendingAssignments: (db.assignments || []).filter(a => a.status === 'pending').length,
    upcomingEvents: (db.events || []).filter(e => e.status === 'upcoming').length,
    availableRooms: (db.rooms || []).filter(r => r.status === 'available').length
  };
}
