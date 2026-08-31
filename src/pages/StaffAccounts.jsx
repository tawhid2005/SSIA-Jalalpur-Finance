import React, { useState, useEffect } from 'react';
import { db } from '../db';
import { UserPlus, Trash2, Key } from 'lucide-react';

const StaffAccounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    role: 'teacher'
  });
  const [deleteId, setDeleteId] = useState(null);

  const loadAccounts = async () => {
    const data = await db.staff_accounts.toArray();
    setAccounts(data);
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check for duplicate username
    const exists = accounts.find(a => a.username.toLowerCase() === formData.username.toLowerCase());
    if (exists) {
      alert("This username already exists. Please choose a different one.");
      return;
    }

    await db.staff_accounts.add(formData);
    setFormData({ name: '', username: '', password: '', role: 'teacher' });
    setShowForm(false);
    loadAccounts();
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    await db.staff_accounts.delete(deleteId);
    setDeleteId(null);
    loadAccounts();
  };

  return (
    <div className="dashboard-page">
      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="print-modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel" style={{ width: '400px', maxWidth: '90%', background: 'var(--bg-panel)', textAlign: 'center' }}>
            <h3 style={{ color: 'var(--status-due)', marginBottom: '1rem' }}>Confirm Deletion</h3>
            <p>Are you sure you want to delete this staff account? They will no longer be able to log in.</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
              <button className="btn btn-secondary" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="btn btn-primary" style={{ backgroundColor: 'var(--status-due)' }} onClick={confirmDelete}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>Staff Accounts</h1>
          <p className="text-muted">Manage login credentials for Teachers and Staff</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <UserPlus size={18} /> {showForm ? 'Cancel' : 'Create New Account'}
        </button>
      </div>

      {showForm && (
        <div className="glass-panel" style={{ marginBottom: '2rem' }}>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            <div className="input-group">
              <label>Staff/Teacher Name *</label>
              <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required placeholder="e.g. John Doe" />
            </div>
            <div className="input-group">
              <label>Login ID / Username *</label>
              <input type="text" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} required placeholder="e.g. john123" />
            </div>
            <div className="input-group">
              <label>Password *</label>
              <input type="text" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required placeholder="Enter password" />
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary">Save Account</button>
            </div>
          </form>
        </div>
      )}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Username (Login ID)</th>
              <th>Password</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map(acc => (
              <tr key={acc.id}>
                <td style={{ fontWeight: 'bold' }}>{acc.name}</td>
                <td style={{ color: 'var(--accent-primary)', fontWeight: 500 }}>{acc.username}</td>
                <td style={{ letterSpacing: '2px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Key size={14} color="var(--text-muted)" />
                    {acc.password}
                  </div>
                </td>
                <td>
                  <span style={{ padding: '0.25rem 0.5rem', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent-primary)', borderRadius: '4px', textTransform: 'capitalize' }}>
                    {acc.role}
                  </span>
                </td>
                <td>
                  <button className="btn-icon" onClick={() => setDeleteId(acc.id)} title="Delete Account" style={{ color: 'var(--status-due)' }}>
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
            {accounts.length === 0 && (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                  No staff accounts created yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StaffAccounts;
