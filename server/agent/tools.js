import {
  getAllSchedules,
  getAllRooms,
  getRoomByNumber,
  checkRoomClash,
  bookRoom,
  cancelRoomBooking,
  getAllEvents,
  findEventByName,
  registerForEvent,
  cancelEventRegistration,
  getAllAnnouncements,
  getAllAssignments
} from '../db/storage.js';

export const CURRENT_DATE = '2026-09-04'; // Friday (Hackathon date)
export const CURRENT_TIME = '15:48';
export const CURRENT_STUDENT = {
  id: '20-40532',
  name: 'Sakibul Hassan',
  department: 'CSE',
  semester: '4.1',
  section: 'B'
};

export const toolDefinitions = [
  {
    name: 'get_current_time_and_context',
    description: 'Get the current date, time, day of the week, and currently logged-in student profile on campus.',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'get_schedules',
    description: 'Retrieve university class schedule timetable. Can filter by day of week (Sunday-Thursday), course code, instructor, or room.',
    parameters: {
      type: 'object',
      properties: {
        day: {
          type: 'string',
          description: 'Day of week: Sunday, Monday, Tuesday, Wednesday, or Thursday'
        },
        course: {
          type: 'string',
          description: 'Course code (e.g., CSE 4113) or title substring'
        },
        instructor: {
          type: 'string',
          description: 'Instructor name filter'
        },
        room: {
          type: 'string',
          description: 'Room number (e.g., 7A07)'
        }
      },
      required: []
    }
  },
  {
    name: 'get_rooms',
    description: 'Search and inspect campus rooms with capacity, equipment (e.g. projector, AC, smart board, whiteboard), type (classroom, lab, seminar), floor, and status.',
    parameters: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          description: 'Room type: classroom, lab, or seminar'
        },
        min_capacity: {
          type: 'integer',
          description: 'Minimum required capacity'
        },
        equipment: {
          type: 'array',
          items: { type: 'string' },
          description: 'Required equipment list, e.g. ["projector"]'
        },
        floor: {
          type: 'integer',
          description: 'Floor number (e.g., 7)'
        },
        status: {
          type: 'string',
          description: 'Room status: available or unavailable'
        }
      },
      required: []
    }
  },
  {
    name: 'check_room_availability',
    description: 'Check whether a specific room is available for booking during a specified date and time window, checking both existing bookings and scheduled classes.',
    parameters: {
      type: 'object',
      properties: {
        room_number: {
          type: 'string',
          description: 'Room code (e.g., 7A02)'
        },
        date: {
          type: 'string',
          description: 'ISO Date (YYYY-MM-DD)'
        },
        start_time: {
          type: 'string',
          description: 'Start time in 24h format (HH:MM, e.g., 15:00)'
        },
        end_time: {
          type: 'string',
          description: 'End time in 24h format (HH:MM, e.g., 17:00)'
        }
      },
      required: ['room_number', 'date', 'start_time', 'end_time']
    }
  },
  {
    name: 'book_room',
    description: 'Book a room for a student or organization. Fails if there is a clash or if parameters are missing or ambiguous. DO NOT call this if the user request is vague (e.g., "book any room tomorrow afternoon") — ask clarification instead.',
    parameters: {
      type: 'object',
      properties: {
        room_number: {
          type: 'string',
          description: 'Exact room number to book (e.g. 7A02)'
        },
        date: {
          type: 'string',
          description: 'ISO Date for booking (YYYY-MM-DD)'
        },
        start_time: {
          type: 'string',
          description: 'Start time in 24h format (HH:MM, e.g. 15:00)'
        },
        end_time: {
          type: 'string',
          description: 'End time in 24h format (HH:MM, e.g. 17:00)'
        },
        booked_by: {
          type: 'string',
          description: 'Name of person or group booking (defaults to current student)'
        },
        purpose: {
          type: 'string',
          description: 'Purpose for booking (e.g. Group study, Project discussion)'
        }
      },
      required: ['room_number', 'date', 'start_time', 'end_time']
    }
  },
  {
    name: 'cancel_room_booking',
    description: 'Cancel an existing room booking by room number and booking ID.',
    parameters: {
      type: 'object',
      properties: {
        room_number: {
          type: 'string',
          description: 'Room number (e.g. 7A02)'
        },
        booking_id: {
          type: 'string',
          description: 'Booking ID (e.g. bk-001)'
        }
      },
      required: ['room_number', 'booking_id']
    }
  },
  {
    name: 'get_events',
    description: 'Fetch campus events, workshops, hackathons, and guest lectures with venue, date, time, capacity, and attendee lists.',
    parameters: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description: 'Event status: upcoming, ongoing, completed, full, cancelled'
        },
        date: {
          type: 'string',
          description: 'ISO Date filter (YYYY-MM-DD)'
        }
      },
      required: []
    }
  },
  {
    name: 'register_event',
    description: 'Register a student for a campus event. Checks for capacity and prevents duplicate registrations.',
    parameters: {
      type: 'object',
      properties: {
        event_id_or_name: {
          type: 'string',
          description: 'Event ID (e.g., evt-002) or title (e.g., "Guest Lecture: Deep Learning in Medical Imaging")'
        },
        student_id: {
          type: 'string',
          description: 'Student ID (defaults to current student)'
        },
        student_name: {
          type: 'string',
          description: 'Student name (defaults to current student)'
        }
      },
      required: ['event_id_or_name']
    }
  },
  {
    name: 'cancel_event_registration',
    description: 'Cancel a student registration for a campus event.',
    parameters: {
      type: 'object',
      properties: {
        event_id_or_name: {
          type: 'string',
          description: 'Event ID or name'
        },
        student_id: {
          type: 'string',
          description: 'Student ID'
        }
      },
      required: ['event_id_or_name', 'student_id']
    }
  },
  {
    name: 'get_announcements',
    description: 'Fetch campus announcements and notices. Announcements frequently contain critical updates such as class relocations, reschedules, syllabus updates, or cancellations.',
    parameters: {
      type: 'object',
      properties: {
        priority: {
          type: 'string',
          description: 'Priority level: high, medium, or low'
        },
        active_only: {
          type: 'boolean',
          description: 'If true, excludes expired notices'
        },
        search: {
          type: 'string',
          description: 'Keywords to search in announcement title or body'
        }
      },
      required: []
    }
  },
  {
    name: 'get_assignments',
    description: 'Fetch student course assignments, deadlines, submission platforms, and marks.',
    parameters: {
      type: 'object',
      properties: {
        course: {
          type: 'string',
          description: 'Course code filter (e.g., CSE 4113)'
        },
        status: {
          type: 'string',
          description: 'Status filter: pending, submitted, graded, late'
        },
        due_this_week: {
          type: 'boolean',
          description: 'Filter for assignments due within the current week'
        }
      },
      required: []
    }
  },
  {
    name: 'ask_clarification',
    description: 'Use this tool when a user request is too vague, ambiguous, or lacks critical parameters (e.g., "Just book me any room tomorrow afternoon") before taking an action.',
    parameters: {
      type: 'object',
      properties: {
        question: {
          type: 'string',
          description: 'The clarification question to ask the student'
        },
        missing_fields: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of missing fields needed, e.g. ["start_time", "end_time", "room_type", "capacity"]'
        },
        suggestions: {
          type: 'array',
          items: { type: 'string' },
          description: 'Helpful suggested options for the user'
        }
      },
      required: ['question']
    }
  }
];

// Implementation of tools that directly execute on storage
export const toolExecutors = {
  get_current_time_and_context: async () => {
    return {
      current_date: CURRENT_DATE,
      current_day_of_week: 'Friday',
      current_time: CURRENT_TIME,
      semester: 'Fall 2026',
      academic_calendar_note: 'University week is Sunday through Thursday. Friday and Saturday are weekends.',
      student: CURRENT_STUDENT
    };
  },

  get_schedules: async (args = {}) => {
    const list = getAllSchedules(args);
    return {
      count: list.length,
      schedules: list
    };
  },

  get_rooms: async (args = {}) => {
    let list = getAllRooms(args);
    if (args.equipment && Array.isArray(args.equipment)) {
      list = list.filter(r => 
        args.equipment.every(req => r.equipment.some(eq => eq.toLowerCase().includes(req.toLowerCase())))
      );
    }
    return {
      count: list.length,
      rooms: list.map(r => ({
        room_number: r.room_number,
        type: r.type,
        capacity: r.capacity,
        equipment: r.equipment,
        floor: r.floor,
        status: r.status,
        active_bookings_count: r.bookings ? r.bookings.length : 0
      }))
    };
  },

  check_room_availability: async (args = {}) => {
    const { room_number, date, start_time, end_time } = args;
    if (!room_number || !date || !start_time || !end_time) {
      return { error: 'room_number, date, start_time, and end_time are required.' };
    }
    const check = checkRoomClash(room_number, date, start_time, end_time);
    return {
      room_number,
      date,
      start_time,
      end_time,
      is_available: !check.hasClash,
      conflict_details: check.hasClash ? check.reason : null
    };
  },

  book_room: async (args = {}) => {
    const { room_number, date, start_time, end_time, booked_by, purpose } = args;
    if (!room_number || !date || !start_time || !end_time) {
      return {
        success: false,
        error: 'Missing required booking information. Please specify room_number, date, start_time, and end_time.'
      };
    }
    try {
      const result = bookRoom(room_number, {
        date,
        start_time,
        end_time,
        booked_by: booked_by || CURRENT_STUDENT.name,
        purpose: purpose || 'Study & Discussion'
      });
      return {
        success: true,
        message: `Successfully booked Room ${room_number} for ${date} from ${start_time} to ${end_time}.`,
        booking_id: result.booking.booking_id,
        booking: result.booking
      };
    } catch (err) {
      return {
        success: false,
        error: err.message
      };
    }
  },

  cancel_room_booking: async (args = {}) => {
    const { room_number, booking_id } = args;
    if (!room_number || !booking_id) {
      return { success: false, error: 'room_number and booking_id are required.' };
    }
    try {
      const res = cancelRoomBooking(room_number, booking_id);
      return {
        success: true,
        message: `Booking ${booking_id} for Room ${room_number} was successfully cancelled.`
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  get_events: async (args = {}) => {
    let list = getAllEvents(args);
    return {
      count: list.length,
      events: list.map(e => ({
        id: e.id,
        name: e.name,
        description: e.description,
        date: e.date,
        start_time: e.start_time,
        end_time: e.end_time,
        venue: e.venue,
        organizer: e.organizer,
        capacity: e.capacity,
        registered: e.registered,
        seats_remaining: Math.max(0, e.capacity - e.registered),
        status: e.status
      }))
    };
  },

  register_event: async (args = {}) => {
    const { event_id_or_name, student_id, student_name } = args;
    if (!event_id_or_name) {
      return { success: false, error: 'event_id_or_name is required.' };
    }
    try {
      const res = registerForEvent(event_id_or_name, {
        student_id: student_id || CURRENT_STUDENT.id,
        name: student_name || CURRENT_STUDENT.name
      });
      return {
        success: true,
        message: `Successfully registered for "${res.event.name}". Venue: Room ${res.event.venue}, Time: ${res.event.date} ${res.event.start_time}-${res.event.end_time}.`,
        event: {
          id: res.event.id,
          name: res.event.name,
          venue: res.event.venue,
          date: res.event.date,
          start_time: res.event.start_time,
          registered: res.event.registered,
          capacity: res.event.capacity
        }
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  cancel_event_registration: async (args = {}) => {
    const { event_id_or_name, student_id } = args;
    try {
      const res = cancelEventRegistration(
        event_id_or_name,
        student_id || CURRENT_STUDENT.id
      );
      return {
        success: true,
        message: `Successfully cancelled registration for "${res.event.name}".`
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  get_announcements: async (args = {}) => {
    let list = getAllAnnouncements(args);
    if (args.search) {
      const q = args.search.toLowerCase();
      list = list.filter(a => a.title.toLowerCase().includes(q) || a.body.toLowerCase().includes(q));
    }
    return {
      count: list.length,
      announcements: list
    };
  },

  get_assignments: async (args = {}) => {
    let list = getAllAssignments(args);
    if (args.due_this_week) {
      // Current date is 2026-09-04 (Friday). Week: 2026-09-04 to 2026-09-11
      list = list.filter(a => a.deadline >= '2026-09-04' && a.deadline <= '2026-09-11');
    }
    return {
      count: list.length,
      assignments: list
    };
  },

  ask_clarification: async (args = {}) => {
    return {
      is_clarification: true,
      question: args.question,
      missing_fields: args.missing_fields || [],
      suggestions: args.suggestions || []
    };
  }
};
