import assert from 'assert';
import {
  initStorage,
  resetToSeed,
  getAllSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getAllRooms,
  createRoom,
  updateRoom,
  deleteRoom,
  bookRoom,
  cancelRoomBooking,
  checkRoomClash,
  getAllEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  registerForEvent,
  cancelEventRegistration,
  getAllAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  getAllAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment
} from '../db/storage.js';
import { runAgent } from '../agent/runner.js';

async function runTests() {
  console.log('\n========================================');
  console.log('🧪 Starting CampusOS Automated Test Suite');
  console.log('========================================\n');

  // Step 1: Storage Initialization & Seed Check
  console.log('▶ Test 1: Seed Data Verification');
  initStorage(true); // Force reset to seed for clean testing
  const schedules = getAllSchedules();
  const rooms = getAllRooms();
  const events = getAllEvents();
  const announcements = getAllAnnouncements();
  const assignments = getAllAssignments();

  assert(schedules.length === 24, `Expected 24 schedules, got ${schedules.length}`);
  assert(rooms.length === 20, `Expected 20 rooms, got ${rooms.length}`);
  assert(events.length === 7, `Expected 7 events, got ${events.length}`);
  assert(announcements.length === 8, `Expected 8 announcements, got ${announcements.length}`);
  assert(assignments.length === 8, `Expected 8 assignments, got ${assignments.length}`);
  console.log('  ✔ All 5 seed datasets loaded correctly (Schedules: 24, Rooms: 20, Events: 7, Announcements: 8, Assignments: 8)\n');

  // Step 2: Schedule CRUD
  console.log('▶ Test 2: Schedule CRUD Operations');
  const newSch = createSchedule({
    course: 'CSE 4999',
    title: 'Senior Design Project',
    day: 'Monday',
    start_time: '14:00',
    end_time: '16:00',
    room: '7A01',
    instructor: 'Dr. Test Instructor',
    section: 'A'
  });
  assert(newSch.id, 'New schedule must have an id');
  assert(getAllSchedules().length === 25, 'Schedule count should increase to 25');

  const updatedSch = updateSchedule(newSch.id, { room: '7A02' });
  assert(updatedSch.room === '7A02', 'Schedule room should be updated');

  const delSch = deleteSchedule(newSch.id);
  assert(delSch === true, 'Schedule should be deleted');
  assert(getAllSchedules().length === 24, 'Schedule count should return to 24');
  console.log('  ✔ Schedule Create, Read, Update, Delete validated successfully.\n');

  // Step 3: Room CRUD & Booking / Clash Detection
  console.log('▶ Test 3: Room CRUD, Booking & Clash Detection');
  const newRoom = createRoom({
    room_number: '7D99',
    type: 'seminar',
    capacity: 100,
    equipment: ['projector', 'AC', 'sound system'],
    floor: 7
  });
  assert(newRoom.room_number === '7D99', 'Room created');

  const clashCheck1 = checkRoomClash('7A01', '2026-09-08', '08:00', '09:00');
  // Book room 7A01
  const booking = bookRoom('7A01', {
    date: '2026-09-08',
    start_time: '18:00',
    end_time: '20:00',
    booked_by: 'Test Student',
    purpose: 'Hackathon Practice'
  });
  assert(booking.booking.booking_id, 'Booking ID created');

  // Try overlapping booking (should fail with clash)
  let clashCaught = false;
  try {
    bookRoom('7A01', {
      date: '2026-09-08',
      start_time: '18:30',
      end_time: '19:30',
      booked_by: 'Another Student',
      purpose: 'Clashing Meeting'
    });
  } catch (err) {
    clashCaught = true;
  }
  assert(clashCaught === true, 'Clash detection prevented overlapping booking');

  // Cancel booking
  const cancelRes = cancelRoomBooking('7A01', booking.booking.booking_id);
  assert(cancelRes.cancelledBooking.booking_id === booking.booking.booking_id, 'Booking cancelled');

  deleteRoom(newRoom.id);
  console.log('  ✔ Room CRUD, Booking, Clash Prevention, and Cancellation validated.\n');

  // Step 4: Event CRUD & Registration
  console.log('▶ Test 4: Event CRUD, Registration & Capacity Management');
  const newEvt = createEvent({
    name: 'Test Workshop',
    date: '2026-09-12',
    start_time: '10:00',
    end_time: '12:00',
    venue: '7A03',
    capacity: 2
  });
  assert(newEvt.capacity === 2, 'Capacity set to 2');

  const reg1 = registerForEvent(newEvt.id, { student_id: '11-11111', name: 'Student 1' });
  const reg2 = registerForEvent(newEvt.id, { student_id: '22-22222', name: 'Student 2' });
  assert(reg2.event.registered === 2, 'Registered count should be 2');
  assert(reg2.event.status === 'full', 'Event status should automatically become full');

  // Third registration should be rejected
  let capacityErrorCaught = false;
  try {
    registerForEvent(newEvt.id, { student_id: '33-33333', name: 'Student 3' });
  } catch (err) {
    capacityErrorCaught = true;
  }
  assert(capacityErrorCaught === true, 'Registration correctly rejected due to full capacity');

  // Cancel registration
  const cancelReg = cancelEventRegistration(newEvt.id, '11-11111');
  assert(cancelReg.event.registered === 1, 'Registered count should decrement to 1');
  assert(cancelReg.event.status === 'upcoming', 'Status should return to upcoming');

  deleteEvent(newEvt.id);
  console.log('  ✔ Event CRUD, Registration, Capacity Enforcement, and Cancellation validated.\n');

  // Step 5: Announcements & Assignments CRUD
  console.log('▶ Test 5: Announcements & Assignments CRUD');
  const newAnn = createAnnouncement({
    title: 'Test Announcement',
    body: 'Testing announcement creation',
    priority: 'high'
  });
  assert(newAnn.title === 'Test Announcement');
  deleteAnnouncement(newAnn.id);

  const newAsgn = createAssignment({
    course: 'CSE 4113',
    title: 'Bonus Quiz',
    deadline: '2026-09-15'
  });
  assert(newAsgn.course === 'CSE 4113');
  deleteAssignment(newAsgn.id);
  console.log('  ✔ Announcements and Assignments CRUD validated.\n');

  // Step 6: AI Agent Query Testing (All Sample Queries)
  console.log('▶ Test 6: AI Agent Query Evaluation');

  const queries = [
    {
      q: 'When is my next class?',
      check: (res) => res.text.includes('CSE 4129') && res.tool_calls.some(t => t.tool === 'get_schedules')
    },
    {
      q: 'What classes do I have on Wednesday?',
      check: (res) => res.text.includes('Wednesday') && res.tool_calls.some(t => t.tool === 'get_schedules')
    },
    {
      q: 'What assignments do I have due this week?',
      check: (res) => res.text.includes('CSE 4113') && res.tool_calls.some(t => t.tool === 'get_assignments')
    },
    {
      q: 'Show me all high priority announcements.',
      check: (res) => res.text.includes('CSE 4113 Class Rescheduled') && res.tool_calls.some(t => t.tool === 'get_announcements')
    },
    {
      q: 'Which labs have a projector and can fit at least 30 people?',
      check: (res) => res.tool_calls.some(t => t.tool === 'get_rooms') && res.text.includes('7B')
    },
    {
      q: "I'm free until 2 PM — is there anything on campus I could drop into?",
      check: (res) => res.tool_calls.some(t => t.tool === 'get_events') && res.text.length > 50
    },
    {
      q: 'Book Room 7A02 tomorrow from 3 PM to 5 PM.',
      check: (res) => res.tool_calls.some(t => t.tool === 'book_room') && res.text.includes('Confirmed')
    },
    {
      q: 'Register me for the Guest Lecture on Deep Learning.',
      check: (res) => res.tool_calls.some(t => t.tool === 'register_event') && (res.text.includes('Successful') || res.text.includes('Confirmed') || res.text.includes('registered'))
    },
    {
      q: 'I need a room for 5 people with a projector, tomorrow between 2 and 4.',
      check: (res) => res.tool_calls.some(t => t.tool === 'get_rooms') && res.text.includes('projector')
    },
    {
      q: 'Just book me any room tomorrow afternoon.',
      check: (res) => res.text.toLowerCase().includes('vague') || res.tool_calls.some(t => t.tool === 'ask_clarification')
    }
  ];

  for (const item of queries) {
    process.stdout.write(`  Testing query: "${item.q}" ... `);
    const agentResponse = await runAgent(item.q);
    assert(agentResponse && agentResponse.text, 'Agent must return text response');
    assert(agentResponse.tool_calls && agentResponse.tool_calls.length > 0, 'Agent must make tool calls');
    const passed = item.check(agentResponse);
    assert(passed, `Query check failed for: ${item.q}`);
    console.log('PASSED (Tool calls: ' + agentResponse.tool_calls.map(t => t.tool).join(', ') + ')');
  }

  // Step 7: Mid-Evaluation Live Edit Check
  console.log('\n▶ Test 7: Mid-Evaluation Live Edit Test');
  console.log('  Simulating dashboard edit: Updating announcement...');
  const annList = getAllAnnouncements();
  const firstAnn = annList[0];
  const originalTitle = firstAnn.title;
  updateAnnouncement(firstAnn.id, { title: 'URGENT: CSE 4113 Moved to Online Mode' });

  // Ask agent immediately
  const liveAgentRes = await runAgent('Show me all high priority announcements.');
  assert(liveAgentRes.text.includes('URGENT: CSE 4113 Moved to Online Mode'), 'Agent must immediately reflect the live edit without caching!');
  console.log('  ✔ Agent immediately reflected the mid-evaluation dashboard edit!');

  // Restore original
  updateAnnouncement(firstAnn.id, { title: originalTitle });

  console.log('\n========================================');
  console.log('🎉 ALL TESTS PASSED SUCCESSFULLY! (7/7)');
  console.log('========================================\n');
}

runTests().catch(err => {
  console.error('\n❌ Test failure:', err);
  process.exit(1);
});
