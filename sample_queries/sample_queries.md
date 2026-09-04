# CampusOS — Sample Queries

These are the queries we will use when judging your agent. Handle them well.

---

## Simple Lookups
- "When is my next class?"
- "What classes do I have on Wednesday?"
- "What assignments do I have due this week?"
- "Show me all high priority announcements."

## Multi-Source Reasoning
- "I'm free until 2 PM — is there anything on campus I could drop into?"
- "Which labs have a projector and can fit at least 30 people?"

## Actions
- "Book Room 7A02 tomorrow from 3 PM to 5 PM."
- "Register me for the Guest Lecture on Deep Learning."
- "I need a room for 5 people with a projector, tomorrow between 2 and 4."

---

## Also supported (beyond the minimum)

Rooms and events require book/register **and** cancel per the problem statement. The agent handles both:

- "Cancel my booking for Room 7A02 tomorrow." — looks up the caller's own bookings, proposes the exact cancellation, waits for confirmation.
- "Cancel my registration for the Guest Lecture." — looks up the caller's own registrations, proposes the cancellation, waits for confirmation.

---

> We will also edit data through the dashboard mid-evaluation and immediately ask the agent about the change. Make sure your agent always reads live data.
