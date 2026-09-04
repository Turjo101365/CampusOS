import React from 'react';
import {
  Calendar,
  Building2,
  Ticket,
  Bell,
  BookOpen,
  ArrowRight,
  Sparkles,
  AlertTriangle,
  Clock,
  MapPin,
  UserCheck
} from 'lucide-react';

export default function Overview({ stats, schedules, events, announcements, assignments, setActiveTab }) {
  const highPriorityAnnouncements = (announcements || []).filter(a => a.priority === 'high');
  const upcomingEvents = (events || []).filter(e => e.status === 'upcoming').slice(0, 3);
  const pendingAssignments = (assignments || []).filter(a => a.status === 'pending').slice(0, 3);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Welcome Banner */}
      <div className="welcome-banner">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-blue)', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <Sparkles size={16} />
            <span>Welcome back, Sakibul Hassan (20-40532)</span>
          </div>
          <h1>
            CampusOS Dashboard
          </h1>
          <p>
            Your university operating system. All schedules, rooms, events, notices, and deadlines updated in real-time and backed by an AI agent that always knows the live campus state.
          </p>
        </div>

        <button
          className="btn-primary"
          onClick={() => setActiveTab('agent')}
          style={{ padding: '12px 24px', fontSize: '0.95rem' }}
        >
          <Sparkles size={18} />
          <span>Ask AI Assistant</span>
        </button>
      </div>

      {/* High Priority Alert Notice */}
      {highPriorityAnnouncements.length > 0 && (
        <div className="urgent-banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: 'rgba(239, 68, 68, 0.2)', color: 'var(--accent-rose)', padding: '8px', borderRadius: 'var(--radius-md)' }}>
              <AlertTriangle size={20} />
            </div>
            <div>
              <div className="urgent-banner-title">
                URGENT CAMPUS NOTICE: {highPriorityAnnouncements[0].title}
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                {highPriorityAnnouncements[0].body.slice(0, 140)}...
              </div>
            </div>
          </div>
          <button
            className="btn-action-sm"
            onClick={() => setActiveTab('announcements')}
            style={{ color: 'var(--accent-rose)', borderColor: 'rgba(239, 68, 68, 0.4)' }}
          >
            <span>View All Notices</span>
            <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* 5 System Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="card" onClick={() => setActiveTab('schedules')} style={{ cursor: 'pointer' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase' }}>Classes Scheduled</span>
            <Calendar size={18} color="var(--accent-indigo)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', marginTop: '10px' }}>
            {stats?.counts?.schedules || 24}
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '4px' }}>
            Sunday – Thursday timetable
          </div>
        </div>

        <div className="card" onClick={() => setActiveTab('rooms')} style={{ cursor: 'pointer' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase' }}>Campus Rooms</span>
            <Building2 size={18} color="var(--accent-blue)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', marginTop: '10px' }}>
            {stats?.counts?.rooms || 20}
          </div>
          <div style={{ color: 'var(--accent-emerald)', fontSize: '0.8rem', marginTop: '4px', fontWeight: '600' }}>
            {stats?.availableRooms || 20} Available right now
          </div>
        </div>

        <div className="card" onClick={() => setActiveTab('events')} style={{ cursor: 'pointer' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase' }}>Campus Events</span>
            <Ticket size={18} color="var(--accent-purple)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', marginTop: '10px' }}>
            {stats?.counts?.events || 7}
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '4px' }}>
            {stats?.upcomingEvents || 6} Upcoming sessions
          </div>
        </div>

        <div className="card" onClick={() => setActiveTab('announcements')} style={{ cursor: 'pointer' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase' }}>Announcements</span>
            <Bell size={18} color="var(--accent-rose)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', marginTop: '10px' }}>
            {stats?.counts?.announcements || 8}
          </div>
          <div style={{ color: 'var(--accent-rose)', fontSize: '0.8rem', marginTop: '4px', fontWeight: '600' }}>
            {stats?.highPriorityAnnouncements || 3} High priority
          </div>
        </div>

        <div className="card" onClick={() => setActiveTab('assignments')} style={{ cursor: 'pointer' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase' }}>Assignments</span>
            <BookOpen size={18} color="var(--accent-amber)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', marginTop: '10px' }}>
            {stats?.counts?.assignments || 8}
          </div>
          <div style={{ color: 'var(--accent-amber)', fontSize: '0.8rem', marginTop: '4px', fontWeight: '600' }}>
            {stats?.pendingAssignments || 5} Pending deadlines
          </div>
        </div>
      </div>

      {/* Two Column Layout: Upcoming Events & Pending Assignments */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '24px' }}>
        {/* Upcoming Events Column */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Ticket size={18} color="var(--accent-purple)" />
              <span>Upcoming Events</span>
            </h3>
            <button className="btn-action-sm" onClick={() => setActiveTab('events')}>
              <span>View All</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {upcomingEvents.map(evt => (
              <div
                key={evt.id}
                style={{
                  background: 'var(--bg-input)',
                  padding: '14px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <div>
                  <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>{evt.name}</div>
                  <div style={{ display: 'flex', gap: '14px', fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} /> {evt.date} · {evt.start_time}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={12} /> Room {evt.venue}
                    </span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className="badge badge-emerald">
                    {evt.registered} / {evt.capacity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Assignments Column */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOpen size={18} color="var(--accent-amber)" />
              <span>Upcoming Deadlines</span>
            </h3>
            <button className="btn-action-sm" onClick={() => setActiveTab('assignments')}>
              <span>View All</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {pendingAssignments.map(asgn => (
              <div
                key={asgn.id}
                style={{
                  background: 'var(--bg-input)',
                  padding: '14px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: '700', color: 'var(--accent-blue)', fontSize: '0.8rem', background: 'rgba(56, 189, 248, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                      {asgn.course}
                    </span>
                    <span style={{ fontWeight: '700', fontSize: '0.9rem' }}>{asgn.title}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '14px', fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    <span>Due: <strong>{asgn.deadline}</strong></span>
                    <span>Platform: {asgn.submission_platform}</span>
                  </div>
                </div>
                <div>
                  <span className="badge badge-amber">{asgn.marks} Marks</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
