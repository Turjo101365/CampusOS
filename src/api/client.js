const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };

  const response = await fetch(url, config);
  const data = await response.json();

  if (!response.ok || data.success === false) {
    const errorMsg = data.error || data.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  // Schedules
  getSchedules: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/schedules${query ? `?${query}` : ''}`);
  },
  createSchedule: (data) => request('/schedules', { method: 'POST', body: JSON.stringify(data) }),
  updateSchedule: (id, data) => request(`/schedules/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSchedule: (id) => request(`/schedules/${id}`, { method: 'DELETE' }),

  // Rooms
  getRooms: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/rooms${query ? `?${query}` : ''}`);
  },
  createRoom: (data) => request('/rooms', { method: 'POST', body: JSON.stringify(data) }),
  updateRoom: (id, data) => request(`/rooms/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteRoom: (id) => request(`/rooms/${id}`, { method: 'DELETE' }),
  bookRoom: (roomNumber, data) => request(`/rooms/${roomNumber}/book`, { method: 'POST', body: JSON.stringify(data) }),
  cancelRoomBooking: (roomNumber, booking_id) => request(`/rooms/${roomNumber}/cancel-booking`, { method: 'POST', body: JSON.stringify({ booking_id }) }),
  checkRoomAvailability: (data) => request('/rooms/check-availability', { method: 'POST', body: JSON.stringify(data) }),

  // Events
  getEvents: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/events${query ? `?${query}` : ''}`);
  },
  createEvent: (data) => request('/events', { method: 'POST', body: JSON.stringify(data) }),
  updateEvent: (id, data) => request(`/events/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteEvent: (id) => request(`/events/${id}`, { method: 'DELETE' }),
  registerEvent: (eventId, data) => request(`/events/${eventId}/register`, { method: 'POST', body: JSON.stringify(data) }),
  cancelEventRegistration: (eventId, student_id) => request(`/events/${eventId}/cancel-registration`, { method: 'POST', body: JSON.stringify({ student_id }) }),

  // Announcements
  getAnnouncements: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/announcements${query ? `?${query}` : ''}`);
  },
  createAnnouncement: (data) => request('/announcements', { method: 'POST', body: JSON.stringify(data) }),
  updateAnnouncement: (id, data) => request(`/announcements/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAnnouncement: (id) => request(`/announcements/${id}`, { method: 'DELETE' }),

  // Assignments
  getAssignments: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/assignments${query ? `?${query}` : ''}`);
  },
  createAssignment: (data) => request('/assignments', { method: 'POST', body: JSON.stringify(data) }),
  updateAssignment: (id, data) => request(`/assignments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAssignment: (id) => request(`/assignments/${id}`, { method: 'DELETE' }),

  // System
  getStats: () => request('/system/stats'),
  resetData: () => request('/system/reset', { method: 'POST' }),

  // Agent
  sendMessage: (message, history = []) => request('/agent/chat', { method: 'POST', body: JSON.stringify({ message, history }) }),
  getAgentTools: () => request('/agent/tools')
};
