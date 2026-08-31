import React, { useState, useEffect } from 'react';
import { db } from '../db';

const TeacherSalary = () => {
  const [salaries, setSalaries] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    month: new Date().toISOString().split('T')[0].slice(0, 7), // YYYY-MM
    teacher: '',
    role: 'Teacher',
    basicSalary: '',
    bonus: '0',
    deduction: '0',
    paid: ''
  });

  const loadSalaries = async () => {
    const data = await db.teacher_salary.toArray();
    setSalaries(data.reverse());
  };

  useEffect(() => {
    loadSalaries();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const basic = parseFloat(formData.basicSalary) || 0;
    const bonus = parseFloat(formData.bonus) || 0;
    const deduction = parseFloat(formData.deduction) || 0;
    const paid = parseFloat(formData.paid) || 0;
    
    const netSalary = basic + bonus - deduction;
    const due = Math.max(0, netSalary - paid);
    
    let status = 'DUE';
    if (due === 0) status = 'PAID';
    else if (paid > 0) status = 'PARTIAL';

    await db.teacher_salary.add({
      ...formData,
      basicSalary: basic,
      bonus,
      deduction,
      netSalary,
      paid,
      due,
      status
    });
    setFormData({ ...formData, teacher: '', basicSalary: '', paid: '' });
    setShowForm(false);
    loadSalaries();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>Teacher Salary</h1>
          <p className="text-muted">Manage staff salaries and payments</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Add Salary Record'}
        </button>
      </div>

      {showForm && (
        <div className="glass-panel" style={{ marginBottom: '2rem' }}>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-group">
              <label>Month</label>
              <input type="month" value={formData.month} onChange={(e) => setFormData({...formData, month: e.target.value})} required />
            </div>
            <div className="input-group">
              <label>Teacher/Staff Name *</label>
              <input type="text" value={formData.teacher} onChange={(e) => setFormData({...formData, teacher: e.target.value})} required />
            </div>
            <div className="input-group">
              <label>Basic Salary (৳) *</label>
              <input type="number" value={formData.basicSalary} onChange={(e) => setFormData({...formData, basicSalary: e.target.value})} required />
            </div>
            <div className="input-group">
              <label>Paid Amount (৳) *</label>
              <input type="number" value={formData.paid} onChange={(e) => setFormData({...formData, paid: e.target.value})} required />
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary">Save Salary</button>
            </div>
          </form>
        </div>
      )}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Month</th>
              <th>Teacher</th>
              <th>Net Salary</th>
              <th>Paid</th>
              <th>Due</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {salaries.map(item => (
              <tr key={item.id}>
                <td>{item.month}</td>
                <td style={{ fontWeight: '600' }}>{item.teacher}</td>
                <td>৳{item.netSalary}</td>
                <td>৳{item.paid}</td>
                <td style={{ color: item.due > 0 ? 'var(--status-due)' : 'inherit', fontWeight: '500' }}>৳{item.due}</td>
                <td>
                  <span className={`status-badge status-${(item.status || 'paid').toLowerCase()}`}>
                    {item.status || 'Paid'}
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
export default TeacherSalary;
