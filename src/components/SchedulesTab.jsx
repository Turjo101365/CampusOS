import React, { useState } from 'react';
import { Plus, Search, Edit2, Trash2, Calendar, Clock, MapPin, User, Tag } from 'lucide-react';
import Modal from './Modal.jsx';

export default function SchedulesTab({ schedules, onAdd, onUpdate, onDelete }) {
  const [selectedDay, setSelectedDay] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const initialForm = {
    course: '',
    title: '',
    day: 'Sunday',
    start_time: '08:00',
    end_time: '08:50',
    room: '7A01',
    instructor: '',
    section: 'B'
  };

  const [formData, setFormData] = useState(initialForm);

  const days = ['All', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];

  const filtered = schedules.filter(s => {
    const matchDay = selectedDay === 'All' || s.day.toLowerCase() === selectedDay.toLowerCase();
    const matchSearch =
      s.course.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.instructor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.room.toLowerCase().includes(searchTerm.toLowerCase());
    return matchDay && matchSearch;
  });

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData(initialForm);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({ ...item });
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingItem) {
      onUpdate(editingItem.id, formData);
    } else {
      onAdd(formData);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id, title) => {
    if (window.confirm(`Are you sure you want to delete "${title}" from the schedule?`)) {
      onDelete(id);
    }
  };

  return (
    <div>
      <div className="section-header">
        <div>
          <h2 className="section-title">
            <Calendar size={26} color="var(--accent-indigo)" />
            <span>Class Timetable & Schedules</span>
          </h2>
          <p className="section-subtitle">
            Manage course schedules across lecture rooms and computer laboratories.
          </p>
        </div>
        <button className="btn-primary" onClick={handleOpenAdd}>
          <Plus size={16} />
          <span>Add Class Schedule</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="search-input-wrap">
          <Search size={16} />
          <input
            type="text"
            className="search-input"
            placeholder="Search by course code, title, room, instructor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto' }}>
          {days.map(d => (
            <button
              key={d}
              className={`btn-action-sm ${selectedDay === d ? 'active' : ''}`}
              style={{
                background: selectedDay === d ? 'var(--accent-indigo)' : 'var(--bg-input)',
                color: selectedDay === d ? '#FFFFFF' : 'var(--text-secondary)'
              }}
              onClick={() => setSelectedDay(d)}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Timetable Cards Grid */}
      <div className="cards-grid">
        {filtered.map(s => (
          <div key={s.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span className="badge badge-indigo">{s.course}</span>
              <span className="badge badge-blue">{s.day}</span>
            </div>

            <div style={{ fontSize: '1.05rem', fontWeight: '700', marginTop: '10px', color: 'var(--text-primary)' }}>
              {s.title}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '12px', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={14} color="var(--accent-blue)" />
                <span>{s.start_time} – {s.end_time}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={14} color="var(--accent-emerald)" />
                <span>Room <strong>{s.room}</strong> (Section: {s.section})</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={14} color="var(--accent-amber)" />
                <span>{s.instructor}</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
              <button className="btn-action-sm" onClick={() => handleOpenEdit(s)}>
                <Edit2 size={13} />
                <span>Edit</span>
              </button>
              <button className="btn-action-sm btn-action-danger" onClick={() => handleDelete(s.id, s.course)}>
                <Trash2 size={13} />
                <span>Delete</span>
              </button>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            No schedules match your selected filters.
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Class Schedule' : 'Add New Class Schedule'}
        footer={
          <>
            <button className="btn-action-sm" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleSubmit}>
              {editingItem ? 'Save Changes' : 'Create Schedule'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="form-group">
            <label className="form-label">Course Code</label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="e.g. CSE 4113"
              value={formData.course}
              onChange={e => setFormData({ ...formData, course: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Course Title</label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="e.g. Pattern Recognition and Machine Learning"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Day of Week</label>
              <select
                className="form-select"
                value={formData.day}
                onChange={e => setFormData({ ...formData, day: e.target.value })}
              >
                <option value="Sunday">Sunday</option>
                <option value="Monday">Monday</option>
                <option value="Tuesday">Tuesday</option>
                <option value="Wednesday">Wednesday</option>
                <option value="Thursday">Thursday</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Section</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. B or B1/B2"
                value={formData.section}
                onChange={e => setFormData({ ...formData, section: e.target.value })}
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
                placeholder="08:00"
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
                placeholder="08:50"
                value={formData.end_time}
                onChange={e => setFormData({ ...formData, end_time: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Room Number</label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="e.g. 7A07"
                value={formData.room}
                onChange={e => setFormData({ ...formData, room: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Instructor</label>
              <input
                type="text"
                className="form-input"
                placeholder="Instructor Name or TBA"
                value={formData.instructor}
                onChange={e => setFormData({ ...formData, instructor: e.target.value })}
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
