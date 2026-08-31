import React, { useState, useEffect } from 'react';
import { db } from '../db';
import { Trash2 } from 'lucide-react';

const Marketing = () => {
  const [marketing, setMarketing] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'Digital Marketing',
    campaign: '',
    vendor: '',
    amount: '',
    month: new Date().toLocaleString('default', { month: 'long', year: 'numeric' })
  });

  const loadMarketing = async () => {
    const data = await db.marketing.toArray();
    setMarketing(data.reverse());
  };

  useEffect(() => {
    loadMarketing();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await db.marketing.add({
      ...formData,
      amount: parseFloat(formData.amount)
    });
    setFormData({ ...formData, campaign: '', vendor: '', amount: '' });
    setShowForm(false);
    loadMarketing();
  };

  const handleDelete = (id) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await db.marketing.delete(deleteId);
      loadMarketing();
      setDeleteId(null);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="print-modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel" style={{ width: '400px', maxWidth: '90%', background: 'var(--bg-panel)', textAlign: 'center' }}>
            <h3 style={{ color: 'var(--status-due)', marginBottom: '1rem' }}>Confirm Deletion</h3>
            <p>Are you sure you want to delete this marketing record? This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
              <button className="btn btn-secondary" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="btn btn-primary" style={{ backgroundColor: 'var(--status-due)' }} onClick={confirmDelete}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>Marketing Expenses</h1>
          <p className="text-muted">Digital and Physical marketing cost tracker</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Add Campaign'}
        </button>
      </div>

      {showForm && (
        <div className="glass-panel" style={{ marginBottom: '2rem' }}>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-group">
              <label>Date</label>
              <input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} required />
            </div>
            <div className="input-group">
              <label>Marketing Type</label>
              <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})}>
                <option>Digital Marketing</option>
                <option>Physical Marketing</option>
              </select>
            </div>
            <div className="input-group">
              <label>Campaign / Details</label>
              <input type="text" value={formData.campaign} onChange={(e) => setFormData({...formData, campaign: e.target.value})} required />
            </div>
            <div className="input-group">
              <label>Amount (৳) *</label>
              <input type="number" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} required />
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary">Save Marketing Expense</button>
            </div>
          </form>
        </div>
      )}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Campaign</th>
              <th>Amount</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {marketing.map(item => (
              <tr key={item.id}>
                <td>{item.date}</td>
                <td>
                  <span className={`status-badge ${item.type === 'Digital Marketing' ? 'status-paid' : 'status-partial'}`}>
                    {item.type}
                  </span>
                </td>
                <td>{item.campaign}</td>
                <td style={{ color: 'var(--status-due)', fontWeight: '600' }}>-৳{item.amount}</td>
                <td>
                  <button className="btn btn-secondary" style={{ padding: '0.4rem', color: 'var(--status-due)', borderColor: 'var(--status-due-bg)' }} onClick={() => handleDelete(item.id)}>
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default Marketing;
