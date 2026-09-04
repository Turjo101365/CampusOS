import React, { useState } from 'react';
import { Bell, Plus, Search, Edit2, Trash2, AlertCircle, Calendar, User, Clock } from 'lucide-react';
import Modal from './Modal.jsx';

export default function AnnouncementsTab({ announcements, onAdd, onUpdate, onDelete }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState('All');
  const [filterActiveOnly, setFilterActiveOnly] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const initialForm = {
    title: '',
    body: '',
    priority: 'medium',
    posted_by: 'CSE Department',
    date: '2026-09-04',
    expires: '2026-09-15'
  };

  const [formData, setFormData] = useState(initialForm);

  const filtered = announcements.filter(a => {
    const matchPriority = filterPriority === 'All' || a.priority.toLowerCase() === filterPriority.toLowerCase();
    const matchSearch =
      a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.body.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.posted_by.toLowerCase().includes(searchTerm.toLowerCase());
    const matchActive = !filterActiveOnly || a.expires >= '2026-09-04';
    return matchPriority && matchSearch && matchActive;
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
    if (window.confirm(`Are you sure you want to delete notice: "${title}"?`)) {
      onDelete(id);
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return <span className="badge badge-rose">HIGH PRIORITY</span>;
      case 'medium':
        return <span className="badge badge-amber">MEDIUM</span>;
      default:
        return <span className="badge badge-blue">LOW</span>;
    }
  };

  return (
    <div>
      <div className="section-header">
        <div>
          <h2 className="section-title">
            <Bell size={26} color="var(--accent-rose)" />
            <span>Campus Announcements & Notices</span>
          </h2>
          <p className="section-subtitle">
            Critical department notices, room reschedules, exam updates, and academic notifications.
          </p>
        </div>
        <button className="btn-primary" onClick={handleOpenAdd}>
          <Plus size={16} />
          <span>Post Announcement</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="search-input-wrap">
          <Search size={16} />
          <input
            type="text"
            className="search-input"
            placeholder="Search announcements..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select className="filter-select" value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
          <option value="All">All Priorities</option>
          <option value="high">High Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="low">Low Priority</option>
        </select>

        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)', cursor: 'pointer', userSelect: 'none' }}>
          <input
            type="checkbox"
            checked={filterActiveOnly}
            onChange={e => setFilterActiveOnly(e.target.checked)}
          />
          <span>Active Only (Hide Expired)</span>
        </label>
      </div>

      {/* Announcements List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {filtered.map(item => {
          const isExpired = item.expires < '2026-09-04';
          return (
            <div
              key={item.id}
              className="card"
              style={{
                borderLeft: item.priority === 'high' ? '4px solid var(--accent-rose)' : item.priority === 'medium' ? '4px solid var(--accent-amber)' : '4px solid var(--accent-blue)',
                opacity: isExpired ? 0.65 : 1
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {getPriorityBadge(item.priority)}
                  {isExpired && <span className="badge" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>EXPIRED</span>}
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ID: {item.id}</span>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn-action-sm" onClick={() => handleOpenEdit(item)}>
                    <Edit2 size={13} />
                    <span>Edit</span>
                  </button>
                  <button className="btn-action-sm btn-action-danger" onClick={() => handleDelete(item.id, item.title)}>
                    <Trash2 size={13} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>

              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginTop: '12px', color: 'var(--text-primary)' }}>
                {item.title}
              </h3>

              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: '1.6' }}>
                {item.body}
              </p>

              <div style={{ display: 'flex', gap: '20px', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)', fontSize: '0.8rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <User size={13} />
                  <span>Posted by: <strong>{item.posted_by}</strong></span>
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Calendar size={13} />
                  <span>Date: <strong>{item.date}</strong></span>
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Clock size={13} />
                  <span>Expires: <strong>{item.expires}</strong></span>
                </span>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            No announcements match your filter criteria.
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Announcement' : 'Post New Announcement'}
        footer={
          <>
            <button className="btn-action-sm" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleSubmit}>
              {editingItem ? 'Save Changes' : 'Post Notice'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="form-group">
            <label className="form-label">Title</label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="e.g. CSE 4113 Class Rescheduled"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Announcement Body</label>
            <textarea
              required
              className="form-textarea"
              placeholder="Write the full announcement text..."
              value={formData.body}
              onChange={e => setFormData({ ...formData, body: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select
                className="form-select"
                value={formData.priority}
                onChange={e => setFormData({ ...formData, priority: e.target.value })}
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Posted By</label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="Author or Department"
                value={formData.posted_by}
                onChange={e => setFormData({ ...formData, posted_by: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Date Posted (YYYY-MM-DD)</label>
              <input
                type="date"
                required
                className="form-input"
                value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Expires On (YYYY-MM-DD)</label>
              <input
                type="date"
                required
                className="form-input"
                value={formData.expires}
                onChange={e => setFormData({ ...formData, expires: e.target.value })}
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
