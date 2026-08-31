import React, { useState, useEffect } from 'react';
import { db } from '../db';
import { LogIn, LogOut, Trash2, Clock } from 'lucide-react';

const Attendance = ({ currentUser }) => {
  const [attendanceList, setAttendanceList] = useState([]);
  const [teacherName, setTeacherName] = useState(currentUser?.role === 'teacher' ? currentUser.name : '');
  const [deleteId, setDeleteId] = useState(null);
  const [checkOutRecord, setCheckOutRecord] = useState(null);
  const [activityNote, setActivityNote] = useState('');

  const loadAttendance = async () => {
    const data = await db.attendance.toArray();
    let filteredData = data.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // If teacher, only show their own records
    if (currentUser?.role === 'teacher') {
      filteredData = filteredData.filter(a => a.teacher === currentUser.name);
    }
    
    setAttendanceList(filteredData);
  };

  useEffect(() => {
    loadAttendance();
  }, []);

  const calculateTotalHours = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return '-';
    
    // We just have times like "10:30" or full ISO strings
    // Let's assume checkIn and checkOut are stored as Date ISO strings to make math easy
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return '-';

    const diffMs = end - start;
    if (diffMs < 0) return '-';

    const diffHrs = Math.floor(diffMs / 3600000);
    const diffMins = Math.floor((diffMs % 3600000) / 60000);
    return `${diffHrs}h ${diffMins}m`;
  };

  const handleCheckIn = async () => {
    if (!teacherName.trim()) {
      alert("Please enter your name to Check In");
      return;
    }

    // Check if already checked in today and not checked out
    const today = new Date().toISOString().split('T')[0];
    const existing = attendanceList.find(a => a.teacher === teacherName && a.date === today && !a.checkOutTime);
    
    if (existing) {
      alert("You are already checked in!");
      return;
    }

    const now = new Date();
    await db.attendance.add({
      date: today,
      teacher: teacherName,
      checkInTime: now.toISOString(),
      checkOutTime: null,
      totalHours: '-',
      note: ''
    });

    if (currentUser?.role !== 'teacher') {
      setTeacherName('');
    }
    loadAttendance();
  };

  const handleCheckOutClick = (record) => {
    setCheckOutRecord(record);
    setActivityNote('');
  };

  const confirmCheckOut = async (e) => {
    e.preventDefault();
    if (!activityNote.trim()) {
      alert("Please write what activities you did today.");
      return;
    }

    const now = new Date();
    const total = calculateTotalHours(checkOutRecord.checkInTime, now.toISOString());
    
    await db.attendance.update(checkOutRecord.id, {
      checkOutTime: now.toISOString(),
      totalHours: total,
      note: activityNote
    });

    setCheckOutRecord(null);
    loadAttendance();
  };

  const handleDelete = (id) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    await db.attendance.delete(deleteId);
    setDeleteId(null);
    loadAttendance();
  };

  const formatTime = (isoString) => {
    if (!isoString) return '-';
    try {
      return new Date(isoString).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    } catch {
      return '-';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return '-';
    }
  };

  return (
    <div className="dashboard-page">
      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="print-modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel" style={{ width: '400px', maxWidth: '90%', background: 'var(--bg-panel)', textAlign: 'center' }}>
            <h3 style={{ color: 'var(--status-due)', marginBottom: '1rem' }}>Confirm Deletion</h3>
            <p>Are you sure you want to delete this attendance record? This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
              <button className="btn btn-secondary" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="btn btn-primary" style={{ backgroundColor: 'var(--status-due)' }} onClick={confirmDelete}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Check Out Note Modal */}
      {checkOutRecord && (
        <div className="print-modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel" style={{ width: '500px', maxWidth: '90%', background: 'var(--bg-panel)' }}>
            <h3 style={{ color: 'var(--accent-primary)', marginBottom: '1rem' }}>Check Out</h3>
            <p className="text-muted" style={{ marginBottom: '1.5rem' }}>Please write a short note about what activities you completed today.</p>
            <form onSubmit={confirmCheckOut}>
              <div className="input-group">
                <label>Daily Activity Note *</label>
                <textarea 
                  rows="4" 
                  value={activityNote} 
                  onChange={(e) => setActivityNote(e.target.value)} 
                  placeholder="e.g. Conducted 3 speaking mock tests, graded reading papers, answered student queries..." 
                  required 
                ></textarea>
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setCheckOutRecord(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <LogOut size={16} /> Submit & Check Out
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>Staff Attendance</h1>
          <p className="text-muted">Track daily arrival, departure, and working hours</p>
        </div>
      </div>

      <div className="glass-panel" style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Clock size={20} color="var(--accent-primary)" />
          Daily Check-In
        </h3>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="input-group" style={{ flex: '1', minWidth: '250px' }}>
            <label>Staff/Teacher Name</label>
            <input 
              type="text" 
              placeholder="Enter your name..." 
              value={teacherName} 
              onChange={(e) => setTeacherName(e.target.value)} 
              disabled={currentUser?.role === 'teacher'}
              style={currentUser?.role === 'teacher' ? { background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' } : {}}
            />
          </div>
          <button className="btn btn-primary" onClick={handleCheckIn} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', height: 'fit-content' }}>
            <LogIn size={18} /> Check In Now
          </button>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Name</th>
              <th>Check In Time</th>
              <th>Check Out Time</th>
              <th>Total Hours</th>
              {currentUser?.role === 'admin' && <th>Activity Note</th>}
              <th className="print-hide">Action</th>
            </tr>
          </thead>
          <tbody>
            {attendanceList.map(item => (
              <tr key={item.id}>
                <td style={{ fontWeight: 500 }}>{formatDate(item.date)}</td>
                <td style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{item.teacher}</td>
                <td>
                  <span style={{ padding: '0.25rem 0.5rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', borderRadius: '4px' }}>
                    {formatTime(item.checkInTime)}
                  </span>
                </td>
                <td>
                  {item.checkOutTime ? (
                    <span style={{ padding: '0.25rem 0.5rem', background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', borderRadius: '4px' }}>
                      {formatTime(item.checkOutTime)}
                    </span>
                  ) : (
                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem', backgroundColor: 'var(--status-due-bg)', color: 'var(--status-due)', border: 'none' }}
                      onClick={() => handleCheckOutClick(item)}
                    >
                      <LogOut size={14} /> Check Out Now
                    </button>
                  )}
                </td>
                <td style={{ fontWeight: 'bold' }}>{item.totalHours}</td>
                {currentUser?.role === 'admin' && (
                  <td style={{ maxWidth: '250px', whiteSpace: 'normal', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {item.note || '-'}
                  </td>
                )}
                <td className="print-hide">
                  <button className="btn-icon" onClick={() => handleDelete(item.id)} title="Delete" style={{ color: 'var(--status-due)' }}>
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {attendanceList.length === 0 && (
              <tr>
                <td colSpan={currentUser?.role === 'admin' ? "7" : "6"} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                  No attendance records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Attendance;
