import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar.jsx';
import Overview from './components/Overview.jsx';
import SchedulesTab from './components/SchedulesTab.jsx';
import RoomsTab from './components/RoomsTab.jsx';
import EventsTab from './components/EventsTab.jsx';
import AnnouncementsTab from './components/AnnouncementsTab.jsx';
import AssignmentsTab from './components/AssignmentsTab.jsx';
import AgentChat from './components/AgentChat.jsx';
import { api } from './api/client.js';
import { Bot, CheckCircle2, AlertCircle } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  // Theme State: defaults to 'light'
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('campusos_theme') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('campusos_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  // 5 Systems Data State
  const [schedules, setSchedules] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [events, setEvents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [stats, setStats] = useState(null);

  // Toast Notification State
  const [toast, setToast] = useState(null);
  const [isResetting, setIsResetting] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [sData, rData, eData, anData, asData, stData] = await Promise.all([
        api.getSchedules(),
        api.getRooms(),
        api.getEvents(),
        api.getAnnouncements(),
        api.getAssignments(),
        api.getStats()
      ]);
      setSchedules(sData.data || []);
      setRooms(rData.data || []);
      setEvents(eData.data || []);
      setAnnouncements(anData.data || []);
      setAssignments(asData.data || []);
      setStats(stData.data || null);
    } catch (err) {
      console.error('Error loading campus data:', err);
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // System Reset
  const handleResetData = async () => {
    if (!window.confirm('Reset all 5 campus systems to the original seed data? This will clear custom bookings and added records.')) {
      return;
    }
    try {
      setIsResetting(true);
      await api.resetData();
      await loadAllData();
      showToast('Database reset to original seed data successfully!');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsResetting(false);
    }
  };

  // ==================== SCHEDULES CRUD ====================
  const handleAddSchedule = async (data) => {
    try {
      const res = await api.createSchedule(data);
      setSchedules(prev => [...prev, res.data]);
      showToast('Class schedule created successfully!');
      api.getStats().then(s => setStats(s.data));
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleUpdateSchedule = async (id, data) => {
    try {
      const res = await api.updateSchedule(id, data);
      setSchedules(prev => prev.map(s => s.id === id ? res.data : s));
      showToast('Schedule updated successfully!');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteSchedule = async (id) => {
    try {
      await api.deleteSchedule(id);
      setSchedules(prev => prev.filter(s => s.id !== id));
      showToast('Schedule deleted successfully!');
      api.getStats().then(s => setStats(s.data));
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // ==================== ROOMS CRUD & BOOKINGS ====================
  const handleAddRoom = async (data) => {
    try {
      const res = await api.createRoom(data);
      setRooms(prev => [...prev, res.data]);
      showToast(`Room ${res.data.room_number} added successfully!`);
      api.getStats().then(s => setStats(s.data));
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleUpdateRoom = async (id, data) => {
    try {
      const res = await api.updateRoom(id, data);
      setRooms(prev => prev.map(r => r.id === id ? res.data : r));
      showToast(`Room ${res.data.room_number} updated!`);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteRoom = async (id) => {
    try {
      await api.deleteRoom(id);
      setRooms(prev => prev.filter(r => r.id !== id));
      showToast('Room deleted successfully!');
      api.getStats().then(s => setStats(s.data));
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleBookRoom = async (roomNumber, data) => {
    const res = await api.bookRoom(roomNumber, data);
    setRooms(prev => prev.map(r => r.room_number.toUpperCase() === roomNumber.toUpperCase() ? res.data : r));
    showToast(res.message);
    api.getStats().then(s => setStats(s.data));
  };

  const handleCancelBooking = async (roomNumber, bookingId) => {
    try {
      const res = await api.cancelRoomBooking(roomNumber, bookingId);
      setRooms(prev => prev.map(r => r.room_number.toUpperCase() === roomNumber.toUpperCase() ? res.data : r));
      showToast(res.message);
      api.getStats().then(s => setStats(s.data));
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // ==================== EVENTS CRUD & REGISTRATION ====================
  const handleAddEvent = async (data) => {
    try {
      const res = await api.createEvent(data);
      setEvents(prev => [...prev, res.data]);
      showToast(`Event "${res.data.name}" created!`);
      api.getStats().then(s => setStats(s.data));
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleUpdateEvent = async (id, data) => {
    try {
      const res = await api.updateEvent(id, data);
      setEvents(prev => prev.map(e => e.id === id ? res.data : e));
      showToast(`Event updated successfully!`);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteEvent = async (id) => {
    try {
      await api.deleteEvent(id);
      setEvents(prev => prev.filter(e => e.id !== id));
      showToast('Event deleted successfully!');
      api.getStats().then(s => setStats(s.data));
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleRegisterEvent = async (eventId, data) => {
    const res = await api.registerEvent(eventId, data);
    setEvents(prev => prev.map(e => e.id === eventId ? res.data : e));
    showToast(res.message);
    api.getStats().then(s => setStats(s.data));
  };

  const handleCancelRegistration = async (eventId, studentId) => {
    try {
      const res = await api.cancelEventRegistration(eventId, studentId);
      setEvents(prev => prev.map(e => e.id === eventId ? res.data : e));
      showToast(res.message);
      api.getStats().then(s => setStats(s.data));
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // ==================== ANNOUNCEMENTS CRUD ====================
  const handleAddAnnouncement = async (data) => {
    try {
      const res = await api.createAnnouncement(data);
      setAnnouncements(prev => [res.data, ...prev]);
      showToast('Announcement posted successfully!');
      api.getStats().then(s => setStats(s.data));
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleUpdateAnnouncement = async (id, data) => {
    try {
      const res = await api.updateAnnouncement(id, data);
      setAnnouncements(prev => prev.map(a => a.id === id ? res.data : a));
      showToast('Announcement updated!');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    try {
      await api.deleteAnnouncement(id);
      setAnnouncements(prev => prev.filter(a => a.id !== id));
      showToast('Announcement deleted!');
      api.getStats().then(s => setStats(s.data));
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // ==================== ASSIGNMENTS CRUD ====================
  const handleAddAssignment = async (data) => {
    try {
      const res = await api.createAssignment(data);
      setAssignments(prev => [...prev, res.data]);
      showToast('Assignment created successfully!');
      api.getStats().then(s => setStats(s.data));
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleUpdateAssignment = async (id, data) => {
    try {
      const res = await api.updateAssignment(id, data);
      setAssignments(prev => prev.map(a => a.id === id ? res.data : a));
      showToast('Assignment updated!');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteAssignment = async (id) => {
    try {
      await api.deleteAssignment(id);
      setAssignments(prev => prev.filter(a => a.id !== id));
      showToast('Assignment deleted!');
      api.getStats().then(s => setStats(s.data));
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="app-container">
      {/* Toast Notification */}
      {toast && (
        <div className={`toast ${toast.type === 'error' ? 'toast-error' : 'toast-success'}`}>
          {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onResetData={handleResetData}
        isResetting={isResetting}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      {/* Main Content View */}
      <main className="main-content">
        {loading && (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
            Loading live campus database...
          </div>
        )}

        {!loading && (
          <>
            {activeTab === 'overview' && (
              <Overview
                stats={stats}
                schedules={schedules}
                events={events}
                announcements={announcements}
                assignments={assignments}
                setActiveTab={setActiveTab}
              />
            )}

            {activeTab === 'schedules' && (
              <SchedulesTab
                schedules={schedules}
                onAdd={handleAddSchedule}
                onUpdate={handleUpdateSchedule}
                onDelete={handleDeleteSchedule}
              />
            )}

            {activeTab === 'rooms' && (
              <RoomsTab
                rooms={rooms}
                onAdd={handleAddRoom}
                onUpdate={handleUpdateRoom}
                onDelete={handleDeleteRoom}
                onBook={handleBookRoom}
                onCancelBooking={handleCancelBooking}
              />
            )}

            {activeTab === 'events' && (
              <EventsTab
                events={events}
                onAdd={handleAddEvent}
                onUpdate={handleUpdateEvent}
                onDelete={handleDeleteEvent}
                onRegister={handleRegisterEvent}
                onCancelRegistration={handleCancelRegistration}
              />
            )}

            {activeTab === 'announcements' && (
              <AnnouncementsTab
                announcements={announcements}
                onAdd={handleAddAnnouncement}
                onUpdate={handleUpdateAnnouncement}
                onDelete={handleDeleteAnnouncement}
              />
            )}

            {activeTab === 'assignments' && (
              <AssignmentsTab
                assignments={assignments}
                onAdd={handleAddAssignment}
                onUpdate={handleUpdateAssignment}
                onDelete={handleDeleteAssignment}
              />
            )}

            {activeTab === 'agent' && (
              <AgentChat
                onDataMutated={loadAllData}
              />
            )}
          </>
        )}
      </main>

      {/* Floating AI Assistant Trigger (when on other tabs) */}
      {activeTab !== 'agent' && (
        <button
          onClick={() => setActiveTab('agent')}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: 'linear-gradient(135deg, var(--accent-indigo), var(--accent-blue))',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-full)',
            padding: '14px 22px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.925rem',
            fontWeight: '700',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-glow)',
            zIndex: 90,
            transition: 'all 0.2s'
          }}
          title="Open CampusOS AI Agent"
        >
          <Bot size={20} />
          <span>Ask CampusOS AI</span>
        </button>
      )}
    </div>
  );
}
