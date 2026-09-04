import React, { useState } from 'react';
import {
  Ticket,
  Plus,
  Search,
  Edit2,
  Trash2,
  UserPlus,
  Users,
  Calendar,
  Clock,
  MapPin,
  XCircle,
  AlertCircle
} from 'lucide-react';
import Modal from './Modal.jsx';

export default function EventsTab({ events, onAdd, onUpdate, onDelete, onRegister, onCancelRegistration }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  // Edit / Add Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  // Register Modal
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [selectedEventForReg, setSelectedEventForReg] = useState(null);
  const [regForm, setRegForm] = useState({
    student_id: '20-40532',
    name: 'Sakibul Hassan'
  });
  const [regError, setRegError] = useState('');

  // Attendee List Modal
  const [isAttendeesModalOpen, setIsAttendeesModalOpen] = useState(false);
  const [selectedEventForAttendees, setSelectedEventForAttendees] = useState(null);

  const initialEventForm = {
    name: '',
    description: '',
    date: '2026-09-10',
    start_time: '10:00',
    end_time: '12:00',
    end_date: '2026-09-10',
    venue: '7C01',
    organizer: 'AUST CSE Department',
    capacity: 60,
    status: 'upcoming'
  };

  const [formData, setFormData] = useState(initialEventForm);

  const filtered = events.filter(e => {
    const matchStatus = filterStatus === 'All' || e.status.toLowerCase() === filterStatus.toLowerCase();
    const matchSearch =
      e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.venue.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.organizer.toLowerCase().includes(searchTerm.toLowerCase());
    return matchStatus && matchSearch;
  });

  const handleOpenAdd = () => {
    setEditingEvent(null);
    setFormData(initialEventForm);
    setIsEditModalOpen(true);
  };

  const handleOpenEdit = (evt) => {
    setEditingEvent(evt);
    setFormData({
      name: evt.name,
      description: evt.description,
      date: evt.date,
      start_time: evt.start_time,
      end_time: evt.end_time,
      end_date: evt.end_date || evt.date,
      venue: evt.venue,
      organizer: evt.organizer,
      capacity: evt.capacity,
      status: evt.status
    });
    setIsEditModalOpen(true);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      capacity: Number(formData.capacity)
    };

    if (editingEvent) {
      onUpdate(editingEvent.id, payload);
    } else {
      onAdd(payload);
    }
    setIsEditModalOpen(false);
  };

  const handleOpenRegister = (evt) => {
    setSelectedEventForReg(evt);
    setRegError('');
    setIsRegisterModalOpen(true);
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegError('');
    try {
      await onRegister(selectedEventForReg.id, regForm);
      setIsRegisterModalOpen(false);
    } catch (err) {
      setRegError(err.message || 'Registration failed.');
    }
  };

  const handleOpenAttendees = (evt) => {
    setSelectedEventForAttendees(evt);
    setIsAttendeesModalOpen(true);
  };

  const handleCancelRegistrationClick = async (eventId, studentId, studentName) => {
    if (window.confirm(`Remove registration for ${studentName} (${studentId})?`)) {
      await onCancelRegistration(eventId, studentId);
      // Update local view
      if (selectedEventForAttendees) {
        const updated = {
          ...selectedEventForAttendees,
          registrations: selectedEventForAttendees.registrations.filter(r => r.student_id !== studentId),
          registered: selectedEventForAttendees.registered - 1
        };
        setSelectedEventForAttendees(updated);
      }
    }
  };

  const handleDelete = (id, name) => {
    if (window.confirm(`Are you sure you want to delete event "${name}"?`)) {
      onDelete(id);
    }
  };

  return (
    <div>
      <div className="section-header">
        <div>
          <h2 className="section-title">
            <Ticket size={26} color="var(--accent-purple)" />
            <span>Campus Events & Workshops</span>
          </h2>
          <p className="section-subtitle">
            Manage hackathons, guest lectures, and departmental review sessions with live student registration.
          </p>
        </div>
        <button className="btn-primary" onClick={handleOpenAdd}>
          <Plus size={16} />
          <span>Add Event</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="search-input-wrap">
          <Search size={16} />
          <input
            type="text"
            className="search-input"
            placeholder="Search events by title, room, organizer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="All">All Statuses</option>
          <option value="upcoming">Upcoming</option>
          <option value="full">Full</option>
          <option value="ongoing">Ongoing</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Events Grid */}
      <div className="cards-grid">
        {filtered.map(evt => {
          const percentFilled = Math.min(100, Math.round((evt.registered / evt.capacity) * 100));
          const isFull = evt.registered >= evt.capacity || evt.status === 'full';

          return (
            <div key={evt.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span className={`badge ${isFull ? 'badge-rose' : 'badge-emerald'}`}>
                  {isFull ? 'FULL' : evt.status}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {evt.organizer}
                </span>
              </div>

              <div style={{ fontSize: '1.2rem', fontWeight: '800', marginTop: '10px', color: 'var(--text-primary)' }}>
                {evt.name}
              </div>

              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '8px', flex: 1 }}>
                {evt.description}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '14px', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={14} color="var(--accent-blue)" />
                  <span>{evt.date} {evt.end_date && evt.end_date !== evt.date ? `– ${evt.end_date}` : ''}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={14} color="var(--accent-indigo)" />
                  <span>{evt.start_time} – {evt.end_time}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={14} color="var(--accent-emerald)" />
                  <span>Room <strong>{evt.venue}</strong></span>
                </div>
              </div>

              {/* Capacity Progress Bar */}
              <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: '700', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Registrations</span>
                  <span style={{ color: isFull ? 'var(--accent-rose)' : 'var(--accent-emerald)' }}>
                    {evt.registered} / {evt.capacity} seats ({percentFilled}%)
                  </span>
                </div>
                <div style={{ height: '6px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${percentFilled}%`,
                      background: isFull ? 'var(--accent-rose)' : 'linear-gradient(90deg, var(--accent-indigo), var(--accent-emerald))',
                      transition: 'width 0.3s ease'
                    }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    className="btn-action-sm"
                    style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-emerald)', borderColor: 'rgba(16, 185, 129, 0.3)' }}
                    onClick={() => handleOpenRegister(evt)}
                    disabled={isFull}
                  >
                    <UserPlus size={14} />
                    <span>{isFull ? 'Full' : 'Register'}</span>
                  </button>
                  <button
                    className="btn-action-sm"
                    onClick={() => handleOpenAttendees(evt)}
                  >
                    <Users size={14} />
                    <span>Attendees</span>
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button className="btn-action-sm" onClick={() => handleOpenEdit(evt)}>
                    <Edit2 size={13} />
                  </button>
                  <button className="btn-action-sm btn-action-danger" onClick={() => handleDelete(evt.id, evt.name)}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Register Student Modal */}
      <Modal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        title={`Register for: ${selectedEventForReg?.name || ''}`}
        footer={
          <>
            <button className="btn-action-sm" onClick={() => setIsRegisterModalOpen(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleRegisterSubmit}>Confirm Registration</button>
          </>
        }
      >
        <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {regError && (
            <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#FCA5A5', padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={16} />
              <span>{regError}</span>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Student ID</label>
            <input
              type="text"
              required
              className="form-input"
              value={regForm.student_id}
              onChange={e => setRegForm({ ...regForm, student_id: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              required
              className="form-input"
              value={regForm.name}
              onChange={e => setRegForm({ ...regForm, name: e.target.value })}
            />
          </div>
        </form>
      </Modal>

      {/* View Attendees Modal */}
      <Modal
        isOpen={isAttendeesModalOpen}
        onClose={() => setIsAttendeesModalOpen(false)}
        title={`Registered Attendees — ${selectedEventForAttendees?.name || ''}`}
        footer={
          <button className="btn-action-sm" onClick={() => setIsAttendeesModalOpen(false)}>Close</button>
        }
      >
        <div>
          <div style={{ marginBottom: '12px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Total registered: <strong>{(selectedEventForAttendees?.registrations || []).length}</strong> / {selectedEventForAttendees?.capacity} seats
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
            {(selectedEventForAttendees?.registrations || []).map((reg, idx) => (
              <div
                key={idx}
                style={{
                  background: 'var(--bg-input)',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div>
                  <div style={{ fontWeight: '700', fontSize: '0.875rem' }}>{reg.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--accent-blue)', fontFamily: 'var(--font-mono)' }}>{reg.student_id}</div>
                </div>
                <button
                  className="btn-action-sm btn-action-danger"
                  onClick={() => handleCancelRegistrationClick(selectedEventForAttendees.id, reg.student_id, reg.name)}
                >
                  Remove
                </button>
              </div>
            ))}
            {(selectedEventForAttendees?.registrations || []).length === 0 && (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                No attendees registered yet.
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Add / Edit Event Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={editingEvent ? 'Edit Event' : 'Add New Campus Event'}
        footer={
          <>
            <button className="btn-action-sm" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleFormSubmit}>
              {editingEvent ? 'Save Event' : 'Create Event'}
            </button>
          </>
        }
      >
        <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="form-group">
            <label className="form-label">Event Name</label>
            <input
              type="text"
              required
              className="form-input"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-textarea"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Date (YYYY-MM-DD)</label>
              <input
                type="date"
                required
                className="form-input"
                value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Venue Room</label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="e.g. 7C01"
                value={formData.venue}
                onChange={e => setFormData({ ...formData, venue: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Start Time (HH:MM)</label>
              <input
                type="text"
                required
                className="form-input"
                value={formData.start_time}
                onChange={e => setFormData({ ...formData, start_time: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">End Time (HH:MM)</label>
              <input
                type="text"
                required
                className="form-input"
                value={formData.end_time}
                onChange={e => setFormData({ ...formData, end_time: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Capacity</label>
              <input
                type="number"
                required
                className="form-input"
                value={formData.capacity}
                onChange={e => setFormData({ ...formData, capacity: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Organizer</label>
              <input
                type="text"
                className="form-input"
                value={formData.organizer}
                onChange={e => setFormData({ ...formData, organizer: e.target.value })}
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
