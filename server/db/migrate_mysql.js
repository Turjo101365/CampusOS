import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');

export async function runMysqlMigration(forceSeed = true) {
  const host = process.env.MYSQL_HOST || '127.0.0.1';
  const port = Number(process.env.MYSQL_PORT) || 3306;
  const user = process.env.MYSQL_USER || 'root';
  const password = process.env.MYSQL_PASSWORD || '';
  const database = process.env.MYSQL_DATABASE || 'appdb';

  console.log(`[MySQL Migration] Connecting to MySQL at ${host}:${port} as ${user}...`);
  const conn = await mysql.createConnection({ host, port, user, password });

  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${database}\``);
  await conn.query(`USE \`${database}\``);
  console.log(`[MySQL Migration] Using database: \`${database}\``);

  // 1. Create Tables
  await conn.query(`
    CREATE TABLE IF NOT EXISTS schedules (
      id VARCHAR(64) PRIMARY KEY,
      course VARCHAR(64) NOT NULL,
      title VARCHAR(255) NOT NULL,
      day VARCHAR(32) NOT NULL,
      start_time VARCHAR(16) NOT NULL,
      end_time VARCHAR(16) NOT NULL,
      room VARCHAR(32) NOT NULL,
      instructor VARCHAR(255) NOT NULL,
      section VARCHAR(32) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS rooms (
      id VARCHAR(64) PRIMARY KEY,
      room_number VARCHAR(32) UNIQUE NOT NULL,
      type VARCHAR(32) NOT NULL,
      capacity INT NOT NULL,
      equipment TEXT NOT NULL,
      floor INT NOT NULL,
      status VARCHAR(32) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS bookings (
      booking_id VARCHAR(64) PRIMARY KEY,
      room_number VARCHAR(32) NOT NULL,
      booked_by VARCHAR(255) NOT NULL,
      date VARCHAR(32) NOT NULL,
      start_time VARCHAR(16) NOT NULL,
      end_time VARCHAR(16) NOT NULL,
      purpose TEXT NOT NULL,
      FOREIGN KEY (room_number) REFERENCES rooms(room_number) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS events (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      date VARCHAR(32) NOT NULL,
      start_time VARCHAR(16) NOT NULL,
      end_time VARCHAR(16) NOT NULL,
      end_date VARCHAR(32) NOT NULL,
      venue VARCHAR(32) NOT NULL,
      organizer VARCHAR(255) NOT NULL,
      capacity INT NOT NULL,
      registered INT NOT NULL DEFAULT 0,
      status VARCHAR(32) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS registrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      event_id VARCHAR(64) NOT NULL,
      student_id VARCHAR(64) NOT NULL,
      name VARCHAR(255) NOT NULL,
      UNIQUE KEY unique_event_student (event_id, student_id),
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS announcements (
      id VARCHAR(64) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      body TEXT NOT NULL,
      date VARCHAR(32) NOT NULL,
      priority VARCHAR(32) NOT NULL,
      posted_by VARCHAR(255) NOT NULL,
      expires VARCHAR(32) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS assignments (
      id VARCHAR(64) PRIMARY KEY,
      course VARCHAR(64) NOT NULL,
      course_title VARCHAR(255) NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      assigned_date VARCHAR(32) NOT NULL,
      deadline VARCHAR(32) NOT NULL,
      submission_platform VARCHAR(255) NOT NULL,
      status VARCHAR(32) NOT NULL,
      marks INT NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  console.log('[MySQL Migration] All 7 tables created / verified in MySQL.');

  // Helper to read seed JSON
  const readJson = (file) => JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf8'));

  // 2. Seed Data
  if (forceSeed) {
    console.log('[MySQL Migration] Seeding initial records into tables...');
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');
    await conn.query('TRUNCATE TABLE registrations');
    await conn.query('TRUNCATE TABLE events');
    await conn.query('TRUNCATE TABLE bookings');
    await conn.query('TRUNCATE TABLE rooms');
    await conn.query('TRUNCATE TABLE schedules');
    await conn.query('TRUNCATE TABLE announcements');
    await conn.query('TRUNCATE TABLE assignments');
    await conn.query('SET FOREIGN_KEY_CHECKS = 1');

    // Schedules
    const schedules = readJson('schedules.json');
    for (const s of schedules) {
      await conn.query(
        'INSERT INTO schedules (id, course, title, day, start_time, end_time, room, instructor, section) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [s.id, s.course, s.title, s.day, s.start_time, s.end_time, s.room, s.instructor, s.section]
      );
    }

    // Rooms & Bookings
    const rooms = readJson('rooms.json');
    for (const r of rooms) {
      await conn.query(
        'INSERT INTO rooms (id, room_number, type, capacity, equipment, floor, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [r.id, r.room_number, r.type, r.capacity, JSON.stringify(r.equipment || []), r.floor, r.status]
      );
      if (r.bookings && r.bookings.length > 0) {
        for (const b of r.bookings) {
          await conn.query(
            'INSERT INTO bookings (booking_id, room_number, booked_by, date, start_time, end_time, purpose) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [b.booking_id, r.room_number, b.booked_by, b.date, b.start_time, b.end_time, b.purpose]
          );
        }
      }
    }

    // Events & Registrations
    const events = readJson('events.json');
    for (const e of events) {
      await conn.query(
        'INSERT INTO events (id, name, description, date, start_time, end_time, end_date, venue, organizer, capacity, registered, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [e.id, e.name, e.description, e.date, e.start_time, e.end_time, e.end_date || e.date, e.venue, e.organizer, e.capacity, e.registered, e.status]
      );
      if (e.registrations && e.registrations.length > 0) {
        for (const reg of e.registrations) {
          try {
            await conn.query(
              'INSERT INTO registrations (event_id, student_id, name) VALUES (?, ?, ?)',
              [e.id, reg.student_id, reg.name]
            );
          } catch (err) {}
        }
      }
    }

    // Announcements
    const announcements = readJson('announcements.json');
    for (const a of announcements) {
      await conn.query(
        'INSERT INTO announcements (id, title, body, date, priority, posted_by, expires) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [a.id, a.title, a.body, a.date, a.priority, a.posted_by, a.expires]
      );
    }

    // Assignments
    const assignments = readJson('assignments.json');
    for (const asgn of assignments) {
      await conn.query(
        'INSERT INTO assignments (id, course, course_title, title, description, assigned_date, deadline, submission_platform, status, marks) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [asgn.id, asgn.course, asgn.course_title, asgn.title, asgn.description, asgn.assigned_date, asgn.deadline, asgn.submission_platform, asgn.status, asgn.marks]
      );
    }
  }

  // Summary counts
  const [[schedCount]] = await conn.query('SELECT COUNT(*) as count FROM schedules');
  const [[roomCount]] = await conn.query('SELECT COUNT(*) as count FROM rooms');
  const [[bookingCount]] = await conn.query('SELECT COUNT(*) as count FROM bookings');
  const [[eventCount]] = await conn.query('SELECT COUNT(*) as count FROM events');
  const [[regCount]] = await conn.query('SELECT COUNT(*) as count FROM registrations');
  const [[annCount]] = await conn.query('SELECT COUNT(*) as count FROM announcements');
  const [[asgnCount]] = await conn.query('SELECT COUNT(*) as count FROM assignments');

  const summary = {
    database,
    schedules: schedCount.count,
    rooms: roomCount.count,
    bookings: bookingCount.count,
    events: eventCount.count,
    registrations: regCount.count,
    announcements: annCount.count,
    assignments: asgnCount.count
  };

  console.log('[MySQL Migration] Successfully migrated and seeded MySQL database!', summary);
  await conn.end();
  return summary;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMysqlMigration(true).catch(console.error);
}
