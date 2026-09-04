import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, '../../data');

export const MYSQL_CONFIG = {
  host: process.env.MYSQL_HOST || '127.0.0.1',
  port: Number(process.env.MYSQL_PORT) || 3306,
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'root123',
  multipleStatements: true
};

export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS schedules (
  id VARCHAR(64) PRIMARY KEY,
  course VARCHAR(64) NOT NULL,
  title VARCHAR(255) NOT NULL,
  day VARCHAR(32) NOT NULL,
  start_time VARCHAR(16) NOT NULL,
  end_time VARCHAR(16) NOT NULL,
  room VARCHAR(64) NOT NULL,
  instructor VARCHAR(128) NOT NULL,
  section VARCHAR(32) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS rooms (
  id VARCHAR(64) PRIMARY KEY,
  room_number VARCHAR(64) UNIQUE NOT NULL,
  type VARCHAR(64) NOT NULL,
  capacity INT NOT NULL,
  equipment TEXT NOT NULL,
  floor INT NOT NULL,
  status VARCHAR(64) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS bookings (
  booking_id VARCHAR(64) PRIMARY KEY,
  room_number VARCHAR(64) NOT NULL,
  booked_by VARCHAR(128) NOT NULL,
  date VARCHAR(32) NOT NULL,
  start_time VARCHAR(16) NOT NULL,
  end_time VARCHAR(16) NOT NULL,
  purpose TEXT NOT NULL,
  FOREIGN KEY (room_number) REFERENCES rooms(room_number) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS events (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  date VARCHAR(32) NOT NULL,
  start_time VARCHAR(16) NOT NULL,
  end_time VARCHAR(16) NOT NULL,
  end_date VARCHAR(32) NOT NULL,
  venue VARCHAR(128) NOT NULL,
  organizer VARCHAR(128) NOT NULL,
  capacity INT NOT NULL,
  registered INT NOT NULL DEFAULT 0,
  status VARCHAR(64) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS registrations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_id VARCHAR(64) NOT NULL,
  student_id VARCHAR(64) NOT NULL,
  name VARCHAR(128) NOT NULL,
  UNIQUE KEY uk_event_student (event_id, student_id),
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS announcements (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  date VARCHAR(32) NOT NULL,
  priority VARCHAR(32) NOT NULL,
  posted_by VARCHAR(128) NOT NULL,
  expires VARCHAR(32) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS assignments (
  id VARCHAR(64) PRIMARY KEY,
  course VARCHAR(64) NOT NULL,
  course_title VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  assigned_date VARCHAR(32) NOT NULL,
  deadline VARCHAR(32) NOT NULL,
  submission_platform VARCHAR(128) NOT NULL,
  status VARCHAR(64) NOT NULL,
  marks INT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

export async function migrateMySQL(targetDb = null, forceSeed = false) {
  const databasesToMigrate = targetDb
    ? [targetDb]
    : [process.env.MYSQL_DATABASE || 'appdb', 'campusos'];

  let connection;
  try {
    connection = await mysql.createConnection(MYSQL_CONFIG);
  } catch (err) {
    console.warn(`[MySQL Migration] Could not connect to MySQL server: ${err.message}`);
    return false;
  }

  const readJson = (file) => JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf8'));

  for (const dbName of new Set(databasesToMigrate)) {
    console.log(`[MySQL Migration] Migrating database: ${dbName}...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
    await connection.query(`USE \`${dbName}\`;`);

    // Execute schema DDL
    await connection.query(SCHEMA_SQL);

    // 1. Schedules
    const [schedRows] = await connection.query('SELECT COUNT(*) as count FROM schedules');
    if (schedRows[0].count === 0 || forceSeed) {
      if (forceSeed) await connection.query('DELETE FROM schedules');
      const schedules = readJson('schedules.json');
      for (const s of schedules) {
        await connection.query(
          `INSERT INTO schedules (id, course, title, day, start_time, end_time, room, instructor, section)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE course=VALUES(course), title=VALUES(title), day=VALUES(day),
           start_time=VALUES(start_time), end_time=VALUES(end_time), room=VALUES(room),
           instructor=VALUES(instructor), section=VALUES(section)`,
          [s.id, s.course, s.title, s.day, s.start_time, s.end_time, s.room, s.instructor, s.section]
        );
      }
    }

    // 2. Rooms & Bookings
    const [roomRows] = await connection.query('SELECT COUNT(*) as count FROM rooms');
    if (roomRows[0].count === 0 || forceSeed) {
      if (forceSeed) {
        await connection.query('DELETE FROM bookings');
        await connection.query('DELETE FROM rooms');
      }
      const rooms = readJson('rooms.json');
      for (const r of rooms) {
        await connection.query(
          `INSERT INTO rooms (id, room_number, type, capacity, equipment, floor, status)
           VALUES (?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE type=VALUES(type), capacity=VALUES(capacity),
           equipment=VALUES(equipment), floor=VALUES(floor), status=VALUES(status)`,
          [
            r.id,
            r.room_number,
            r.type,
            Number(r.capacity),
            JSON.stringify(r.equipment || []),
            Number(r.floor),
            r.status
          ]
        );
        if (r.bookings && r.bookings.length > 0) {
          for (const b of r.bookings) {
            await connection.query(
              `INSERT INTO bookings (booking_id, room_number, booked_by, date, start_time, end_time, purpose)
               VALUES (?, ?, ?, ?, ?, ?, ?)
               ON DUPLICATE KEY UPDATE purpose=VALUES(purpose)`,
              [b.booking_id, r.room_number, b.booked_by, b.date, b.start_time, b.end_time, b.purpose]
            );
          }
        }
      }
    }

    // 3. Events & Registrations
    const [eventRows] = await connection.query('SELECT COUNT(*) as count FROM events');
    if (eventRows[0].count === 0 || forceSeed) {
      if (forceSeed) {
        await connection.query('DELETE FROM registrations');
        await connection.query('DELETE FROM events');
      }
      const events = readJson('events.json');
      for (const e of events) {
        await connection.query(
          `INSERT INTO events (id, name, description, date, start_time, end_time, end_date, venue, organizer, capacity, registered, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE name=VALUES(name), description=VALUES(description),
           capacity=VALUES(capacity), registered=VALUES(registered), status=VALUES(status)`,
          [
            e.id,
            e.name,
            e.description,
            e.date,
            e.start_time,
            e.end_time,
            e.end_date || e.date,
            e.venue,
            e.organizer,
            Number(e.capacity),
            Number(e.registered),
            e.status
          ]
        );
        if (e.registrations && e.registrations.length > 0) {
          for (const reg of e.registrations) {
            await connection.query(
              `INSERT IGNORE INTO registrations (event_id, student_id, name) VALUES (?, ?, ?)`,
              [e.id, reg.student_id, reg.name]
            );
          }
        }
      }
    }

    // 4. Announcements
    const [annRows] = await connection.query('SELECT COUNT(*) as count FROM announcements');
    if (annRows[0].count === 0 || forceSeed) {
      if (forceSeed) await connection.query('DELETE FROM announcements');
      const announcements = readJson('announcements.json');
      for (const a of announcements) {
        await connection.query(
          `INSERT INTO announcements (id, title, body, date, priority, posted_by, expires)
           VALUES (?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE title=VALUES(title), body=VALUES(body), priority=VALUES(priority)`,
          [a.id, a.title, a.body, a.date, a.priority, a.posted_by, a.expires]
        );
      }
    }

    // 5. Assignments
    const [asgnRows] = await connection.query('SELECT COUNT(*) as count FROM assignments');
    if (asgnRows[0].count === 0 || forceSeed) {
      if (forceSeed) await connection.query('DELETE FROM assignments');
      const assignments = readJson('assignments.json');
      for (const a of assignments) {
        await connection.query(
          `INSERT INTO assignments (id, course, course_title, title, description, assigned_date, deadline, submission_platform, status, marks)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE title=VALUES(title), status=VALUES(status), marks=VALUES(marks)`,
          [
            a.id,
            a.course,
            a.course_title,
            a.title,
            a.description,
            a.assigned_date,
            a.deadline,
            a.submission_platform,
            a.status,
            Number(a.marks)
          ]
        );
      }
    }

    console.log(`[MySQL Migration] Successfully initialized tables & seed data for '${dbName}'.`);
  }

  await connection.end();
  return true;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const force = process.argv.includes('--force') || process.argv.includes('--reset');
  migrateMySQL(null, force).catch(console.error);
}
