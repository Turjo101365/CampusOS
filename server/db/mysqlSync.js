import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { migrateMySQL } from './migrateMysql.js';

dotenv.config();

let pool = null;
let isConnected = false;

export async function initMysqlSync() {
  const host = process.env.MYSQL_HOST || '127.0.0.1';
  const port = Number(process.env.MYSQL_PORT) || 3306;
  const user = process.env.MYSQL_USER || 'root';
  const password = process.env.MYSQL_PASSWORD || 'root123';
  const database = process.env.MYSQL_DATABASE || 'appdb';

  try {
    // 1. Run migrations / seed sync for both databases
    await migrateMySQL(database);
    await migrateMySQL('campusos');

    // 2. Create connection pool
    pool = mysql.createPool({
      host,
      port,
      user,
      password,
      database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();

    isConnected = true;
    console.log(`[MySQL Sync] Real-time phpMyAdmin sync active on MySQL database '${database}'.`);
  } catch (err) {
    console.warn(`[MySQL Sync] MySQL server not reachable (${err.message}). CampusOS operating on SQLite.`);
    isConnected = false;
  }
}

async function safeQuery(sql, params = []) {
  if (!isConnected || !pool) return;
  try {
    await pool.query(sql, params);
  } catch (err) {
    console.warn(`[MySQL Sync Error] ${err.message}`);
  }
}

// ==================== SCHEDULES ====================
export function syncCreateSchedule(record) {
  safeQuery(
    `INSERT INTO schedules (id, course, title, day, start_time, end_time, room, instructor, section)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE course=VALUES(course), title=VALUES(title), day=VALUES(day),
     start_time=VALUES(start_time), end_time=VALUES(end_time), room=VALUES(room),
     instructor=VALUES(instructor), section=VALUES(section)`,
    [
      record.id,
      record.course,
      record.title,
      record.day,
      record.start_time,
      record.end_time,
      record.room,
      record.instructor,
      record.section
    ]
  );
}

export function syncUpdateSchedule(record) {
  safeQuery(
    `UPDATE schedules
     SET course = ?, title = ?, day = ?, start_time = ?, end_time = ?, room = ?, instructor = ?, section = ?
     WHERE id = ?`,
    [
      record.course,
      record.title,
      record.day,
      record.start_time,
      record.end_time,
      record.room,
      record.instructor,
      record.section,
      record.id
    ]
  );
}

export function syncDeleteSchedule(id) {
  safeQuery('DELETE FROM schedules WHERE id = ?', [id]);
}

// ==================== ROOMS & BOOKINGS ====================
export function syncCreateRoom(record) {
  const eq = typeof record.equipment === 'string' ? record.equipment : JSON.stringify(record.equipment || []);
  safeQuery(
    `INSERT INTO rooms (id, room_number, type, capacity, equipment, floor, status)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE type=VALUES(type), capacity=VALUES(capacity),
     equipment=VALUES(equipment), floor=VALUES(floor), status=VALUES(status)`,
    [
      record.id,
      record.room_number,
      record.type,
      Number(record.capacity),
      eq,
      Number(record.floor),
      record.status
    ]
  );
}

export function syncUpdateRoom(record) {
  const eq = typeof record.equipment === 'string' ? record.equipment : JSON.stringify(record.equipment || []);
  safeQuery(
    `UPDATE rooms
     SET room_number = ?, type = ?, capacity = ?, equipment = ?, floor = ?, status = ?
     WHERE id = ?`,
    [
      record.room_number,
      record.type,
      Number(record.capacity),
      eq,
      Number(record.floor),
      record.status,
      record.id
    ]
  );
}

export function syncDeleteRoom(id) {
  safeQuery('DELETE FROM rooms WHERE id = ?', [id]);
}

export function syncBookRoom(booking) {
  safeQuery(
    `INSERT INTO bookings (booking_id, room_number, booked_by, date, start_time, end_time, purpose)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE purpose=VALUES(purpose)`,
    [
      booking.booking_id,
      booking.room_number,
      booking.booked_by,
      booking.date,
      booking.start_time,
      booking.end_time,
      booking.purpose
    ]
  );
}

export function syncCancelBooking(bookingId) {
  safeQuery('DELETE FROM bookings WHERE booking_id = ?', [bookingId]);
}

// ==================== EVENTS & REGISTRATIONS ====================
export function syncCreateEvent(record) {
  safeQuery(
    `INSERT INTO events (id, name, description, date, start_time, end_time, end_date, venue, organizer, capacity, registered, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE name=VALUES(name), description=VALUES(description),
     capacity=VALUES(capacity), registered=VALUES(registered), status=VALUES(status)`,
    [
      record.id,
      record.name,
      record.description,
      record.date,
      record.start_time,
      record.end_time,
      record.end_date || record.date,
      record.venue,
      record.organizer,
      Number(record.capacity),
      Number(record.registered),
      record.status
    ]
  );
}

export function syncUpdateEvent(record) {
  safeQuery(
    `UPDATE events
     SET name = ?, description = ?, date = ?, start_time = ?, end_time = ?, end_date = ?,
         venue = ?, organizer = ?, capacity = ?, registered = ?, status = ?
     WHERE id = ?`,
    [
      record.name,
      record.description,
      record.date,
      record.start_time,
      record.end_time,
      record.end_date || record.date,
      record.venue,
      record.organizer,
      Number(record.capacity),
      Number(record.registered),
      record.status,
      record.id
    ]
  );
}

export function syncDeleteEvent(id) {
  safeQuery('DELETE FROM events WHERE id = ?', [id]);
}

export function syncRegisterEvent(eventId, studentId, name) {
  safeQuery(
    `INSERT IGNORE INTO registrations (event_id, student_id, name) VALUES (?, ?, ?)`,
    [eventId, studentId, name]
  );
  safeQuery(
    `UPDATE events SET registered = registered + 1 WHERE id = ?`,
    [eventId]
  );
}

export function syncCancelRegistration(eventId, studentId) {
  safeQuery(
    `DELETE FROM registrations WHERE event_id = ? AND student_id = ?`,
    [eventId, studentId]
  );
  safeQuery(
    `UPDATE events SET registered = CASE WHEN registered > 0 THEN registered - 1 ELSE 0 END WHERE id = ?`,
    [eventId]
  );
}

// ==================== ANNOUNCEMENTS ====================
export function syncCreateAnnouncement(record) {
  safeQuery(
    `INSERT INTO announcements (id, title, body, date, priority, posted_by, expires)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE title=VALUES(title), body=VALUES(body), priority=VALUES(priority)`,
    [
      record.id,
      record.title,
      record.body,
      record.date,
      record.priority,
      record.posted_by,
      record.expires
    ]
  );
}

export function syncUpdateAnnouncement(record) {
  safeQuery(
    `UPDATE announcements
     SET title = ?, body = ?, date = ?, priority = ?, posted_by = ?, expires = ?
     WHERE id = ?`,
    [
      record.title,
      record.body,
      record.date,
      record.priority,
      record.posted_by,
      record.expires,
      record.id
    ]
  );
}

export function syncDeleteAnnouncement(id) {
  safeQuery('DELETE FROM announcements WHERE id = ?', [id]);
}

// ==================== ASSIGNMENTS ====================
export function syncCreateAssignment(record) {
  safeQuery(
    `INSERT INTO assignments (id, course, course_title, title, description, assigned_date, deadline, submission_platform, status, marks)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE title=VALUES(title), status=VALUES(status), marks=VALUES(marks)`,
    [
      record.id,
      record.course,
      record.course_title,
      record.title,
      record.description,
      record.assigned_date,
      record.deadline,
      record.submission_platform,
      record.status,
      Number(record.marks)
    ]
  );
}

export function syncUpdateAssignment(record) {
  safeQuery(
    `UPDATE assignments
     SET course = ?, course_title = ?, title = ?, description = ?, assigned_date = ?,
         deadline = ?, submission_platform = ?, status = ?, marks = ?
     WHERE id = ?`,
    [
      record.course,
      record.course_title,
      record.title,
      record.description,
      record.assigned_date,
      record.deadline,
      record.submission_platform,
      record.status,
      Number(record.marks),
      record.id
    ]
  );
}

export function syncDeleteAssignment(id) {
  safeQuery('DELETE FROM assignments WHERE id = ?', [id]);
}

export function syncResetToSeed() {
  migrateMySQL(null, true).catch(err => console.warn('[MySQL Sync Reset Error]', err.message));
}
