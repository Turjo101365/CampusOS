import React, { useState } from 'react';
import { BookOpen, Plus, Search, Edit2, Trash2, Calendar, Award, ExternalLink, CheckCircle, Clock } from 'lucide-react';
import Modal from './Modal.jsx';

export default function AssignmentsTab({ assignments, onAdd, onUpdate, onDelete }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const initialForm = {
    course: 'CSE 4113',
    course_title: 'Pattern Recognition and Machine Learning',
    title: '',
    description: '',
    assigned_date: '2026-09-04',
    deadline: '2026-09-12',
    submission_platform: 'Google Classroom',
    status: 'pending',
    marks: 10
  };

  const [formData, setFormData] = useState(initialForm);

  const filtered = assignments.filter(a => {
    const matchStatus = filterStatus === 'All' || a.status.toLowerCase() === filterStatus.toLowerCase();
    const matchSearch =
      a.course.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchStatus && matchSearch;
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
    const payload = {
      ...formData,
      marks: Number(formData.marks)
    };
    if (editingItem) {
      onUpdate(editingItem.id, payload);
    } else {
      onAdd(payload);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id, title) => {
    if (window.confirm(`Are you sure you want to delete assignment: "${title}"?`)) {
      onDelete(id);
    }
  };

  const getStatusBadge = (status) => {
    switch (status.toLowerCase()) {
      case 'submitted':
        return <span className="badge badge-emerald">SUBMITTED</span>;
      case 'graded':
        return <span className="badge badge-blue">GRADED</span>;
      case 'late':
        return <span className="badge badge-rose">LATE</span>;
      default:
        return <span className="badge badge-amber">PENDING</span>;
    }
  };

  return (
    <div>
      <div className="section-header">
        <div>
          <h2 className="section-title">
            <BookOpen size={26} color="var(--accent-amber)" />
            <span>Course Assignments & Deadlines</span>
          </h2>
          <p className="section-subtitle">
            Track homework tasks, lab reports, and term papers across semester subjects.
          </p>
        </div>
        <button className="btn-primary" onClick={handleOpenAdd}>
          <Plus size={16} />
          <span>Add Assignment</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="search-input-wrap">
          <Search size={16} />
          <input
            type="text"
            className="search-input"
            placeholder="Search assignments by course or title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="All">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="submitted">Submitted</option>
          <option value="graded">Graded</option>
          <option value="late">Late</option>
        </select>
      </div>

      {/* Assignments Cards Grid */}
      <div className="cards-grid">
        {filtered.map(asgn => (
          <div key={asgn.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span className="badge badge-indigo">{asgn.course}</span>
              {getStatusBadge(asgn.status)}
            </div>

            <div style={{ fontSize: '1.15rem', fontWeight: '800', marginTop: '10px', color: 'var(--text-primary)' }}>
              {asgn.title}
            </div>

            <div style={{ fontSize: '0.8rem', color: 'var(--accent-blue)', marginTop: '2px', fontWeight: '600' }}>
              {asgn.course_title}
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '8px', flex: 1, lineHeight: '1.5' }}>
              {asgn.description}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '14px', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={14} color="var(--accent-amber)" />
                <span>Deadline: <strong style={{ color: 'var(--text-primary)' }}>{asgn.deadline}</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Award size={14} color="var(--accent-emerald)" />
                <span>Weight: <strong>{asgn.marks} Marks</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ExternalLink size={14} color="var(--accent-blue)" />
                <span>Submit via: {asgn.submission_platform}</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
              <button className="btn-action-sm" onClick={() => handleOpenEdit(asgn)}>
                <Edit2 size={13} />
                <span>Edit</span>
              </button>
              <button className="btn-action-sm btn-action-danger" onClick={() => handleDelete(asgn.id, asgn.title)}>
                <Trash2 size={13} />
                <span>Delete</span>
              </button>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            No assignments found.
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Assignment' : 'Add New Assignment'}
        footer={
          <>
            <button className="btn-action-sm" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleSubmit}>
              {editingItem ? 'Save Changes' : 'Create Assignment'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
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
                placeholder="Full subject name"
                value={formData.course_title}
                onChange={e => setFormData({ ...formData, course_title: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Assignment Title</label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="e.g. Lab Report 1: Data Preprocessing"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description / Instructions</label>
            <textarea
              className="form-textarea"
              placeholder="Requirements, file types, dataset link..."
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Deadline (YYYY-MM-DD)</label>
              <input
                type="date"
                required
                className="form-input"
                value={formData.deadline}
                onChange={e => setFormData({ ...formData, deadline: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Marks</label>
              <input
                type="number"
                required
                className="form-input"
                value={formData.marks}
                onChange={e => setFormData({ ...formData, marks: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Submission Platform</label>
              <input
                type="text"
                className="form-input"
                placeholder="Google Classroom, Physical, etc."
                value={formData.submission_platform}
                onChange={e => setFormData({ ...formData, submission_platform: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                className="form-select"
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="pending">pending</option>
                <option value="submitted">submitted</option>
                <option value="graded">graded</option>
                <option value="late">late</option>
              </select>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
