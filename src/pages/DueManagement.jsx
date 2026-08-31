import React, { useState, useEffect } from 'react';
import { db } from '../db';

const DueManagement = () => {
  const [dueStudents, setDueStudents] = useState([]);

  useEffect(() => {
    const loadDues = async () => {
      const allStudents = await db.students.toArray();
      // Filter students who have due > 0
      const filtered = allStudents.filter(student => student.due > 0);
      setDueStudents(filtered);
    };
    loadDues();
  }, []);

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1>Due Management</h1>
        <p className="text-muted">Real-time list of all students with pending dues</p>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Student Name</th>
              <th>Course</th>
              <th>Net Fee</th>
              <th>Total Paid</th>
              <th>Due Amount</th>
              <th>Phone</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {dueStudents.length === 0 ? (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>No pending dues! All clear.</td></tr>
            ) : dueStudents.map(student => (
              <tr key={student.id}>
                <td style={{ fontWeight: '600', color: 'var(--accent-primary)' }}>{student.id}</td>
                <td>{student.name}</td>
                <td>{student.course}</td>
                <td>৳{student.netFee}</td>
                <td>৳{student.totalPaid}</td>
                <td style={{ color: 'var(--status-due)', fontWeight: '700' }}>৳{student.due}</td>
                <td>{student.phone}</td>
                <td>
                  <span className={`status-badge status-${(student.status || 'active').toLowerCase()}`}>
                    {student.status || 'Active'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DueManagement;
