-- CampusOS Relational Database Schema (SQLite)

CREATE TABLE IF NOT EXISTS schedules (
  id TEXT PRIMARY KEY,
  course TEXT NOT NULL,
  title TEXT NOT NULL,
  day TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  room TEXT NOT NULL,
  instructor TEXT NOT NULL,
  section TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS rooms (
  id TEXT PRIMARY KEY,
  room_number TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL,
  capacity INTEGER NOT NULL,
  equipment TEXT NOT NULL,
  floor INTEGER NOT NULL,
  status TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS bookings (
  booking_id TEXT PRIMARY KEY,
  room_number TEXT NOT NULL,
  booked_by TEXT NOT NULL,
  date TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  purpose TEXT NOT NULL,
  FOREIGN KEY (room_number) REFERENCES rooms(room_number) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  date TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  end_date TEXT NOT NULL,
  venue TEXT NOT NULL,
  organizer TEXT NOT NULL,
  capacity INTEGER NOT NULL,
  registered INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS registrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  name TEXT NOT NULL,
  UNIQUE(event_id, student_id),
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS announcements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  date TEXT NOT NULL,
  priority TEXT NOT NULL,
  posted_by TEXT NOT NULL,
  expires TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS assignments (
  id TEXT PRIMARY KEY,
  course TEXT NOT NULL,
  course_title TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  assigned_date TEXT NOT NULL,
  deadline TEXT NOT NULL,
  submission_platform TEXT NOT NULL,
  status TEXT NOT NULL,
  marks INTEGER NOT NULL
);
