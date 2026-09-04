# API documentation

Base URL: `http://localhost:4000/api/v1`

Local requests use `x-user-id` as a development identity override. If omitted, `DEV_USER_ID` is used. This header is not a production authentication mechanism.

## Response envelope

Success:

```json
{ "success": true, "data": {}, "message": "Operation successful" }
```

Error:

```json
{
  "success": false,
  "data": null,
  "message": "Request validation failed",
  "error": { "code": "VALIDATION_ERROR", "details": {} }
}
```

## Endpoints

| Method | Path | Responsibility |
| --- | --- | --- |
| `GET` | `/health` | Process health (outside `/api/v1`) |
| `GET, POST` | `/schedules` | List or create schedules |
| `GET, PATCH, DELETE` | `/schedules/:id` | Read, update, or remove a schedule |
| `GET, POST` | `/rooms` | List or create rooms |
| `GET` | `/rooms/available` | Find conflict-free rooms by date/time/capacity/features |
| `GET, PATCH, DELETE` | `/rooms/:id` | Read, update, or remove a room |
| `POST` | `/rooms/:id/bookings` | Confirm a permission-checked, conflict-free room booking |
| `GET, POST` | `/events` | List or create events |
| `GET, PATCH, DELETE` | `/events/:id` | Read, update, or remove an event |
| `POST` | `/events/:id/registrations` | Confirm registration with ownership, capacity, and schedule checks |
| `GET, POST` | `/assignments` | List or create assignments |
| `GET, PATCH, DELETE` | `/assignments/:id` | Read, update, or remove an assignment |
| `PATCH` | `/assignments/:id/status` | Confirm an enrolled student's legal submission-status transition |
| `GET, POST` | `/announcements` | List or create announcements |
| `GET, PATCH, DELETE` | `/announcements/:id` | Read, update, or remove an announcement |
| `GET, POST` | `/users` | List or create users |
| `GET, PATCH, DELETE` | `/users/:id` | Read, update, or remove a user |
| `GET, POST` | `/notifications` | List or create notifications |
| `GET, PATCH, DELETE` | `/notifications/:id` | Read, update, or remove a user-scoped notification |
| `GET` | `/ai/tools` | List AI-visible tools |
| `POST` | `/ai/chat` | Send a message to the campus assistant |
| `DELETE` | `/ai/sessions/:sessionId` | Clear bounded local AI history |

## Query examples

Find a projector-equipped lab for 30 people:

```http
GET /api/v1/rooms/available?date=2026-09-07&startTime=14:00&endTime=16:00&minCapacity=30&type=LAB&features=projector
```

Get Wednesday classes for the demo student:

```http
GET /api/v1/schedules?day=WEDNESDAY&userId=20-40532
```

Ask the AI assistant:

```http
POST /api/v1/ai/chat
Content-Type: application/json

{ "message": "What assignments are due this week?", "sessionId": "browser-session-123" }
```

Dates sent to mutation endpoints are ISO 8601 date-times. Room availability uses `YYYY-MM-DD` dates and `HH:mm` 24-hour times.

## Operational action contracts

Operational routes derive the actor from authentication. `x-user-id` is only the local development stand-in. Room bookings ignore any client-supplied display name and persist the authenticated user's name. Event registration targets the current user unless an administrator explicitly supplies another `userId`. Assignment status updates are student-only, enrollment-scoped, deadline-aware, and cannot set `GRADED`.

Room booking:

```http
POST /api/v1/rooms/{roomId}/bookings
Content-Type: application/json

{ "date": "2026-09-07", "startTime": "14:00", "endTime": "15:00", "purpose": "Project meeting" }
```

Event registration:

```http
POST /api/v1/events/{eventId}/registrations
Content-Type: application/json

{}
```

Assignment status:

```http
PATCH /api/v1/assignments/{assignmentId}/status
Content-Type: application/json

{ "status": "IN_PROGRESS" }
```

All three return an action receipt inside the shared response envelope:

```json
{
  "action": "ROOM_BOOKING",
  "status": "CONFIRMED",
  "message": "7A01 is booked for 2026-09-07 from 14:00 to 15:00.",
  "confirmedAt": "2026-09-04T12:00:00.000Z",
  "result": {}
}
```
