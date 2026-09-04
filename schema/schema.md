# CampusOS — Data Schema

Canonical source: [`database/schema.prisma`](../database/schema.prisma) (MySQL via Prisma). This file documents the exact field names and types for the five systems referenced in the problem statement, plus the two extra action tables (room bookings, event registrations).

## Schedule (`schedules` table, Prisma model `Schedule`)

| Field | Type | Notes |
| --- | --- | --- |
| `id` | string (UUID) | Primary key |
| `courseId` | string (UUID) | FK → `Course` (holds course code/title/department) |
| `roomId` | string (UUID) | FK → `Room` |
| `dayOfWeek` | enum | `SUNDAY`..`SATURDAY` |
| `startTime` | time | HH:mm |
| `endTime` | time | HH:mm |
| `instructor` | string | |
| `section` | string | |
| `semester` | string | default `"Fall 2026"` |

Actions: view, add, edit, delete.

## Room (`rooms` table, Prisma model `Room`)

| Field | Type | Notes |
| --- | --- | --- |
| `id` | string (UUID) | Primary key |
| `number` | string | Unique, e.g. `7A07` |
| `type` | enum | `CLASSROOM` / `LAB` / `SEMINAR` / `AUDITORIUM` / `STUDY` |
| `capacity` | integer | |
| `floor` | integer | |
| `status` | enum | `AVAILABLE` / `MAINTENANCE` / `CLOSED` |
| `features` | string[] | Equipment, e.g. `projector`, `ac` (relational `RoomFeature` rows) |

Actions: view, add, edit, delete, **book**, **cancel** (a booking).

### Room booking (`room_bookings` table, Prisma model `RoomBooking`)

| Field | Type | Notes |
| --- | --- | --- |
| `id` | string (UUID) | Primary key |
| `roomId` | string (UUID) | FK → `Room` |
| `userId` | string (UUID, nullable) | FK → `User` |
| `bookedBy` | string | Display name |
| `purpose` | string | |
| `startsAt` / `endsAt` | datetime | |

`POST /api/v1/rooms/:id/bookings` books; `DELETE /api/v1/rooms/:id/bookings/:bookingId` cancels; `GET /api/v1/rooms/bookings/mine` lists the current user's bookings.

## Event (`campus_events` table, Prisma model `CampusEvent`)

| Field | Type | Notes |
| --- | --- | --- |
| `id` | string (UUID) | Primary key |
| `name` | string | |
| `description` | string (nullable) | |
| `startsAt` / `endsAt` | datetime | |
| `roomId` | string (UUID, nullable) | FK → `Room` |
| `venueLabel` | string | Display venue |
| `organizer` | string | |
| `capacity` | integer | |
| `status` | enum | `UPCOMING` / `ACTIVE` / `COMPLETED` / `CANCELLED` |

Actions: view, add, edit, delete, **register**, **cancel** (a registration).

### Event registration (`event_registrations` table, Prisma model `EventRegistration`)

| Field | Type | Notes |
| --- | --- | --- |
| `id` | string (UUID) | Primary key |
| `eventId` | string (UUID) | FK → `CampusEvent` |
| `userId` | string (UUID) | FK → `User` |
| `registeredAt` | datetime | |

`POST /api/v1/events/:id/registrations` registers; `DELETE /api/v1/events/:id/registrations` cancels the caller's (or, for an admin, a specified `userId`'s) registration; `GET /api/v1/events?userId=` includes the caller's registration status per event.

## Announcement (`announcements` table, Prisma model `Announcement`)

| Field | Type | Notes |
| --- | --- | --- |
| `id` | string (UUID) | Primary key |
| `title` | string | |
| `body` | string | |
| `priority` | enum | `LOW` / `MEDIUM` / `HIGH` / `URGENT` |
| `postedBy` | string | |
| `publishedAt` | datetime | defaults to now |
| `expiresAt` | datetime (nullable) | |

Actions: view, add, edit, delete.

## Assignment (`assignments` table, Prisma model `Assignment`)

| Field | Type | Notes |
| --- | --- | --- |
| `id` | string (UUID) | Primary key |
| `courseId` | string (UUID) | FK → `Course` |
| `title` | string | |
| `description` | string (nullable) | |
| `assignedAt` / `dueAt` | datetime | |
| `submissionPlatform` | string | |
| `marks` | integer | |

Per-student status lives in `AssignmentSubmission` (`status`: `PENDING` / `IN_PROGRESS` / `SUBMITTED` / `GRADED`), not on the assignment itself — a student's assignment list resolves their own submission row.

Actions: view, add, edit, delete, and a status transition (`PATCH /api/v1/assignments/:id/status`) used by both the dashboard and the AI agent.

## Full documentation

For the entity-relationship diagram, index rationale, and migration workflow, see [`docs/database-design.md`](../docs/database-design.md).
