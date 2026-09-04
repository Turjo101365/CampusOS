import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DatabaseSync } from 'node:sqlite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, '../../data');
const STORAGE_DIR = path.resolve(__dirname, '../data');
const DB_PATH = path.join(STORAGE_DIR, 'campusos.sqlite');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

export function runMigration(forceSeed = false) {
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
  }

  console.log(`[Database Migration] Connecting to SQLite: ${DB_PATH}`);
  const db = new DatabaseSync(DB_PATH);

  // 1. Run schema DDL
  const schemaSql = fs.readFileSync(SCHEMA_PATH, 'utf8');
  db.exec(schemaSql);
  console.log('[Database Migration] Tables successfully created / verified.');

  // Helper to read JSON
  const readJson = (file) => JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf8'));

  // 2. Check and migrate schedules
  const schedCount = db.prepare('SELECT COUNT(*) as count FROM schedules').get().count;
  if (schedCount === 0 || forceSeed) {
    if (forceSeed) db.exec('DELETE FROM schedules');
    const schedules = readJson('schedules.json');
    const insert = db.prepare(`
      INSERT INTO schedules (id, course, title, day, start_time, end_time, room, instructor, section)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const s of schedules) {
      insert.run(s.id, s.course, s.title, s.day, s.start_time, s.end_time, s.room, s.instructor, s.section);
    }
    console.log(`[Database Migration] Migrated & seeded ${schedules.length} schedules.`);
  }

  // 3. Check and migrate rooms & bookings
  const roomCount = db.prepare('SELECT COUNT(*) as count FROM rooms').get().count;
  if (roomCount === 0 || forceSeed) {
    if (forceSeed) {
      db.exec('DELETE FROM bookings');
      db.exec('DELETE FROM rooms');
    }
    const rooms = readJson('rooms.json');
    const insertRoom = db.prepare(`
      INSERT INTO rooms (id, room_number, type, capacity, equipment, floor, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const insertBooking = db.prepare(`
      INSERT INTO bookings (booking_id, room_number, booked_by, date, start_time, end_time, purpose)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    let bookingTotal = 0;
    for (const r of rooms) {
      insertRoom.run(
        r.id,
        r.room_number,
        r.type,
        Number(r.capacity),
        JSON.stringify(r.equipment || []),
        Number(r.floor),
        r.status
      );
      if (r.bookings && r.bookings.length > 0) {
        for (const b of r.bookings) {
          insertBooking.run(b.booking_id, r.room_number, b.booked_by, b.date, b.start_time, b.end_time, b.purpose);
          bookingTotal++;
        }
      }
    }
    console.log(`[Database Migration] Migrated & seeded ${rooms.length} rooms and ${bookingTotal} bookings.`);
  }

  // 4. Check and migrate events & registrations
  const eventCount = db.prepare('SELECT COUNT(*) as count FROM events').get().count;
  if (eventCount === 0 || forceSeed) {
    if (forceSeed) {
      db.exec('DELETE FROM registrations');
      db.exec('DELETE FROM events');
    }
    const events = readJson('events.json');
    const insertEvent = db.prepare(`
      INSERT INTO events (id, name, description, date, start_time, end_time, end_date, venue, organizer, capacity, registered, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertReg = db.prepare(`
      INSERT INTO registrations (event_id, student_id, name)
      VALUES (?, ?, ?)
    `);

    let regTotal = 0;
    for (const e of events) {
      insertEvent.run(
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
      );
      if (e.registrations && e.registrations.length > 0) {
        for (const reg of e.registrations) {
          try {
            insertReg.run(e.id, reg.student_id, reg.name);
            regTotal++;
          } catch (e) {}
        }
      }
    }
    console.log(`[Database Migration] Migrated & seeded ${events.length} events and ${regTotal} registrations.`);
  }

  // 5. Check and migrate announcements
  const annCount = db.prepare('SELECT COUNT(*) as count FROM announcements').get().count;
  if (annCount === 0 || forceSeed) {
    if (forceSeed) db.exec('DELETE FROM announcements');
    const announcements = readJson('announcements.json');
    const insertAnn = db.prepare(`
      INSERT INTO announcements (id, title, body, date, priority, posted_by, expires)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    for (const a of announcements) {
      insertAnn.run(a.id, a.title, a.body, a.date, a.priority, a.posted_by, a.expires);
    }
    console.log(`[Database Migration] Migrated & seeded ${announcements.length} announcements.`);
  }

  // 6. Check and migrate assignments
  const asgnCount = db.prepare('SELECT COUNT(*) as count FROM assignments').get().count;
  if (asgnCount === 0 || forceSeed) {
    if (forceSeed) db.exec('DELETE FROM assignments');
    const assignments = readJson('assignments.json');
    const insertAsgn = db.prepare(`
      INSERT INTO assignments (id, course, course_title, title, description, assigned_date, deadline, submission_platform, status, marks)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const a of assignments) {
      insertAsgn.run(
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
      );
    }
    console.log(`[Database Migration] Migrated & seeded ${assignments.length} assignments.`);
  }

  // Final summary
  const summary = {
    schedules: db.prepare('SELECT COUNT(*) as count FROM schedules').get().count,
    rooms: db.prepare('SELECT COUNT(*) as count FROM rooms').get().count,
    bookings: db.prepare('SELECT COUNT(*) as count FROM bookings').get().count,
    events: db.prepare('SELECT COUNT(*) as count FROM events').get().count,
    registrations: db.prepare('SELECT COUNT(*) as count FROM registrations').get().count,
    announcements: db.prepare('SELECT COUNT(*) as count FROM announcements').get().count,
    assignments: db.prepare('SELECT COUNT(*) as count FROM assignments').get().count
  };

  console.log('[Database Migration] Migration successfully completed! Table Record Counts:', summary);
  db.close();
  return summary;
}

// If run directly: node server/db/migrate.js
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const force = process.argv.includes('--force') || process.argv.includes('--reset');
  runMigration(force);
}
