import React, { useState, useEffect } from 'react';
import { db } from '../db';
import { LogIn, LogOut, Edit2, Trash2, Clock } from 'lucide-react';

const Attendance = () => {
  const [attendanceList, setAttendanceList] = useState([]);
  const [teacherName, setTeacherName] = useState('');
  const [deleteId, setDeleteId] = useState(null);

  const loadAttendance = async () => {
    const data = await db.attendance.toArray();
    // Sort by date descending, then time
    data.sort((a, b) => new Date(b.date) - new Date(a.date));
    setAttendanceList(data);
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
      totalHours: '-'
    });

    setTeacherName('');
    loadAttendance();
  };

  const handleCheckOut = async (record) => {
    const now = new Date();
    const total = calculateTotalHours(record.checkInTime, now.toISOString());
    
    await db.attendance.update(record.id, {
      checkOutTime: now.toISOString(),
      totalHours: total
    });

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
                      onClick={() => handleCheckOut(item)}
                    >
                      <LogOut size={14} /> Check Out Now
                    </button>
                  )}
                </td>
                <td style={{ fontWeight: 'bold' }}>{item.totalHours}</td>
                <td className="print-hide">
                  <button className="btn-icon" onClick={() => handleDelete(item.id)} title="Delete" style={{ color: 'var(--status-due)' }}>
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {attendanceList.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
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
