import React, { useState } from 'react';
import {
  Building2,
  Plus,
  Search,
  Edit2,
  Trash2,
  BookmarkPlus,
  XCircle,
  Users,
  Layers,
  Tv,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import Modal from './Modal.jsx';

export default function RoomsTab({ rooms, onAdd, onUpdate, onDelete, onBook, onCancelBooking }) {
  const [filterType, setFilterType] = useState('All');
  const [filterEquipment, setFilterEquipment] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);

  // Booking Modal State
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [selectedRoomForBooking, setSelectedRoomForBooking] = useState(null);
  const [bookingForm, setBookingForm] = useState({
    date: '2026-09-05',
    start_time: '15:00',
    end_time: '17:00',
    booked_by: 'Sakibul Hassan',
    purpose: 'Study & Discussion'
  });
  const [bookingError, setBookingError] = useState('');

  // Room Form State
  const initialRoomForm = {
    room_number: '',
    type: 'classroom',
    capacity: 40,
    equipment: 'whiteboard, projector, AC',
    floor: 7,
    status: 'available'
  };
  const [roomFormData, setRoomFormData] = useState(initialRoomForm);

  const filtered = rooms.filter(r => {
    const matchType = filterType === 'All' || r.type.toLowerCase() === filterType.toLowerCase();
    const matchEquipment = filterEquipment === 'All' || (r.equipment && r.equipment.some(e => e.toLowerCase().includes(filterEquipment.toLowerCase())));
    const matchSearch =
      r.room_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.type.toLowerCase().includes(searchTerm.toLowerCase());
    return matchType && matchEquipment && matchSearch;
  });

  const handleOpenAdd = () => {
    setEditingRoom(null);
    setRoomFormData(initialRoomForm);
    setIsEditModalOpen(true);
  };

  const handleOpenEdit = (room) => {
    setEditingRoom(room);
    setRoomFormData({
      room_number: room.room_number,
      type: room.type,
      capacity: room.capacity,
      equipment: Array.isArray(room.equipment) ? room.equipment.join(', ') : room.equipment,
      floor: room.floor,
      status: room.status
    });
    setIsEditModalOpen(true);
  };

  const handleRoomSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...roomFormData,
      capacity: Number(roomFormData.capacity),
      floor: Number(roomFormData.floor),
      equipment: typeof roomFormData.equipment === 'string'
        ? roomFormData.equipment.split(',').map(s => s.trim()).filter(Boolean)
        : roomFormData.equipment
    };

    if (editingRoom) {
      onUpdate(editingRoom.id, payload);
    } else {
      onAdd(payload);
    }
    setIsEditModalOpen(false);
  };

  const handleOpenBooking = (room) => {
    setSelectedRoomForBooking(room);
    setBookingError('');
    setIsBookModalOpen(true);
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setBookingError('');
    try {
      await onBook(selectedRoomForBooking.room_number, bookingForm);
      setIsBookModalOpen(false);
    } catch (err) {
      setBookingError(err.message || 'Failed to book room.');
    }
  };

  const handleDeleteRoom = (id, number) => {
    if (window.confirm(`Are you sure you want to delete Room ${number}?`)) {
      onDelete(id);
    }
  };

  const handleCancelBookingClick = (roomNumber, bookingId, purpose) => {
    if (window.confirm(`Cancel booking "${purpose}" (${bookingId}) for Room ${roomNumber}?`)) {
      onCancelBooking(roomNumber, bookingId);
    }
  };

  return (
    <div>
      <div className="section-header">
        <div>
          <h2 className="section-title">
            <Building2 size={26} color="var(--accent-blue)" />
            <span>Campus Rooms & Bookings</span>
          </h2>
          <p className="section-subtitle">
            View lecture halls, computer labs, and seminar rooms with live equipment specs and booking management.
          </p>
        </div>
        <button className="btn-primary" onClick={handleOpenAdd}>
          <Plus size={16} />
          <span>Add Room</span>
        </button>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div className="search-input-wrap">
          <Search size={16} />
          <input
            type="text"
            className="search-input"
            placeholder="Search room code (e.g. 7A02, 7B08)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select className="filter-select" value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="All">All Types</option>
          <option value="classroom">Classroom (7A)</option>
          <option value="lab">Computer Lab (7B)</option>
          <option value="seminar">Seminar Hall (7C)</option>
        </select>

        <select className="filter-select" value={filterEquipment} onChange={e => setFilterEquipment(e.target.value)}>
          <option value="All">All Equipment</option>
          <option value="projector">Has Projector</option>
          <option value="smart board">Has Smart Board</option>
          <option value="AC">Has AC</option>
        </select>
      </div>

      {/* Room Cards Grid */}
      <div className="cards-grid">
        {filtered.map(room => (
          <div key={room.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: '800', letterSpacing: '-0.02em' }}>
                Room {room.room_number}
              </div>
              <span className={`badge ${room.status === 'available' ? 'badge-emerald' : 'badge-rose'}`}>
                {room.status}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '10px', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Users size={14} color="var(--accent-indigo)" />
                <strong>{room.capacity}</strong> Seats
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Layers size={14} color="var(--accent-blue)" />
                Floor {room.floor} ({room.type})
              </span>
            </div>

            {/* Equipment Tags */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '12px' }}>
              {(room.equipment || []).map((eq, i) => (
                <span
                  key={i}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '4px',
                    padding: '2px 8px',
                    fontSize: '0.725rem',
                    color: 'var(--text-secondary)'
                  }}
                >
                  {eq}
                </span>
              ))}
            </div>

            {/* Existing Bookings */}
            <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>
                Active Bookings ({(room.bookings || []).length})
              </div>
              {(room.bookings || []).length === 0 ? (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  No active reservations. Room is free.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {room.bookings.map(b => (
                    <div
                      key={b.booking_id}
                      style={{
                        background: 'var(--bg-input)',
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.78rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <div>
                        <div><strong>{b.purpose}</strong> ({b.booked_by})</div>
                        <div style={{ color: 'var(--text-muted)' }}>{b.date} · {b.start_time} - {b.end_time}</div>
                      </div>
                      <button
                        className="btn-action-sm btn-action-danger"
                        style={{ padding: '3px 6px', fontSize: '0.7rem' }}
                        title="Cancel this booking"
                        onClick={() => handleCancelBookingClick(room.room_number, b.booking_id, b.purpose)}
                      >
                        Cancel
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '18px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
              <button
                className="btn-action-sm"
                style={{ background: 'rgba(56, 189, 248, 0.15)', color: 'var(--accent-blue)', borderColor: 'rgba(56, 189, 248, 0.3)' }}
                onClick={() => handleOpenBooking(room)}
              >
                <BookmarkPlus size={14} />
                <span>Book Room</span>
              </button>

              <div style={{ display: 'flex', gap: '6px' }}>
                <button className="btn-action-sm" onClick={() => handleOpenEdit(room)}>
                  <Edit2 size={13} />
                  <span>Edit</span>
                </button>
                <button className="btn-action-sm btn-action-danger" onClick={() => handleDeleteRoom(room.id, room.room_number)}>
                  <Trash2 size={13} />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Book Room Modal */}
      <Modal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        title={`Book Room ${selectedRoomForBooking?.room_number || ''}`}
        footer={
          <>
            <button className="btn-action-sm" onClick={() => setIsBookModalOpen(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleBookingSubmit}>Confirm Booking</button>
          </>
        }
      >
        <form onSubmit={handleBookingSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {bookingError && (
            <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#FCA5A5', padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={16} />
              <span>{bookingError}</span>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Date (YYYY-MM-DD)</label>
            <input
              type="date"
              required
              className="form-input"
              value={bookingForm.date}
              onChange={e => setBookingForm({ ...bookingForm, date: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Start Time (24h HH:MM)</label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="15:00"
                value={bookingForm.start_time}
                onChange={e => setBookingForm({ ...bookingForm, start_time: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">End Time (24h HH:MM)</label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="17:00"
                value={bookingForm.end_time}
                onChange={e => setBookingForm({ ...bookingForm, end_time: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Booked By</label>
            <input
              type="text"
              required
              className="form-input"
              value={bookingForm.booked_by}
              onChange={e => setBookingForm({ ...bookingForm, booked_by: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Purpose / Event Name</label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="e.g. ACM Study Group, Project Prep"
              value={bookingForm.purpose}
              onChange={e => setBookingForm({ ...bookingForm, purpose: e.target.value })}
            />
          </div>
        </form>
      </Modal>

      {/* Add / Edit Room Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={editingRoom ? `Edit Room ${editingRoom.room_number}` : 'Add New Room'}
        footer={
          <>
            <button className="btn-action-sm" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleRoomSubmit}>
              {editingRoom ? 'Save Room' : 'Create Room'}
            </button>
          </>
        }
      >
        <form onSubmit={handleRoomSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Room Number</label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="e.g. 7A08"
                value={roomFormData.room_number}
                onChange={e => setRoomFormData({ ...roomFormData, room_number: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Room Type</label>
              <select
                className="form-select"
                value={roomFormData.type}
                onChange={e => setRoomFormData({ ...roomFormData, type: e.target.value })}
              >
                <option value="classroom">Classroom</option>
                <option value="lab">Computer Lab</option>
                <option value="seminar">Seminar Hall</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Capacity (seats)</label>
              <input
                type="number"
                required
                className="form-input"
                value={roomFormData.capacity}
                onChange={e => setRoomFormData({ ...roomFormData, capacity: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Floor</label>
              <input
                type="number"
                required
                className="form-input"
                value={roomFormData.floor}
                onChange={e => setRoomFormData({ ...roomFormData, floor: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Equipment (comma separated)</label>
            <input
              type="text"
              className="form-input"
              placeholder="whiteboard, projector, AC, smart board"
              value={roomFormData.equipment}
              onChange={e => setRoomFormData({ ...roomFormData, equipment: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Status</label>
            <select
              className="form-select"
              value={roomFormData.status}
              onChange={e => setRoomFormData({ ...roomFormData, status: e.target.value })}
            >
              <option value="available">available</option>
              <option value="unavailable">unavailable</option>
            </select>
          </div>
        </form>
      </Modal>
    </div>
  );
}
