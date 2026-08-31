import React, { useState, useEffect } from 'react';
import { db } from '../db';
import { FileText, Trash2, Printer, X } from 'lucide-react';
import PrintHeader from '../components/PrintHeader';

const MockTests = () => {
  const [tests, setTests] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [studentType, setStudentType] = useState('internal');
  const [studentFound, setStudentFound] = useState(null);
  const [previousTestsCount, setPreviousTestsCount] = useState(0);
  const [lastTest, setLastTest] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const [formData, setFormData] = useState({
    studentId: '',
    name: '',
    phone: '',
    date: new Date().toISOString().split('T')[0],
    fee: '0',
    paymentMethod: 'Cash'
  });

  const loadTests = async () => {
    const allTests = await db.mock_tests.toArray();
    setTests(allTests.reverse());
  };

  useEffect(() => {
    loadTests();
  }, []);

  const handleIdChange = async (e) => {
    const id = e.target.value.toUpperCase();
    setFormData({ ...formData, studentId: id });
    
    if (id.length > 5) {
      const student = await db.students.get(id);
      if (student) {
        setStudentFound(true);
        setFormData(prev => ({ ...prev, name: student.name, phone: student.phone }));
        
        // Count previous tests
        const count = await db.mock_tests.where('studentId').equals(id).count();
        setPreviousTestsCount(count);
      } else {
        setStudentFound(false);
        setPreviousTestsCount(0);
      }
    } else {
      setStudentFound(null);
      setPreviousTestsCount(0);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newTest = {
      studentType,
      studentId: studentType === 'internal' ? formData.studentId : 'N/A',
      name: formData.name,
      phone: formData.phone,
      date: formData.date,
      fee: parseFloat(formData.fee) || 0,
      paymentMethod: formData.paymentMethod,
      timestamp: new Date().getTime()
    };
    const testId = await db.mock_tests.add(newTest);

    setLastTest({...newTest, id: testId});
    
    setFormData({ studentId: '', name: '', phone: '', date: new Date().toISOString().split('T')[0], fee: '0', paymentMethod: 'Cash' });
    setShowForm(false);
    setStudentFound(null);
    setPreviousTestsCount(0);
    loadTests();
  };

  const handleDelete = (id) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await db.mock_tests.delete(deleteId);
      
      loadTests();
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
            <p>Are you sure you want to delete this mock test record? This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
              <button className="btn btn-secondary" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="btn btn-primary" style={{ backgroundColor: 'var(--status-due)' }} onClick={confirmDelete}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Mock Test Slip Modal */}
      {lastTest && (
        <div className="print-modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel print-modal" style={{ width: '500px', maxWidth: '90%', maxHeight: '90vh', overflowY: 'auto', background: 'white', color: 'black' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }} className="print-hide">
              <button className="btn btn-secondary" onClick={() => setLastTest(null)}><X size={18} /> Close</button>
              <button className="btn btn-primary" onClick={() => window.print()}><Printer size={18} /> Print Slip</button>
            </div>

            <div id="printable-area" style={{ padding: '2rem', background: 'white' }}>
              <PrintHeader title="MOCK TEST SLIP" />
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginTop: '2rem', fontSize: '1.1rem' }}>
                <div><strong>Date:</strong> {lastTest.date}</div>
                <div><strong>Name:</strong> {lastTest.name}</div>
                <div><strong>Phone:</strong> {lastTest.phone}</div>
                <div><strong>Type:</strong> {lastTest.studentType === 'internal' ? `Internal Student (${lastTest.studentId})` : 'External Student'}</div>
              </div>

              <div style={{ marginTop: '2rem', border: '1px solid #ccc', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid #ccc', background: '#f9f9f9', fontWeight: 'bold' }}>
                  <span>Test Fee</span>
                  <span>{lastTest.fee > 0 ? `৳${lastTest.fee}` : 'Free'}</span>
                </div>
                {lastTest.fee > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid #ccc' }}>
                    <span>Payment Method</span>
                    <span>{lastTest.paymentMethod}</span>
                  </div>
                )}
              </div>

              <div style={{ marginTop: '4rem', display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ borderTop: '1px solid #000', paddingTop: '0.5rem', width: '200px', textAlign: 'center' }}>Authorized Signature</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>Mock Test Management</h1>
          <p className="text-muted">Track internal and external mock test participants</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <FileText size={18} /> {showForm ? 'Cancel' : 'New Mock Test Entry'}
        </button>
      </div>

      {showForm && (
        <div className="glass-panel" style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem', color: 'var(--accent-primary)' }}>Register Mock Test</h3>
          
          <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input type="radio" checked={studentType === 'internal'} onChange={() => { setStudentType('internal'); setFormData({...formData, name: '', phone: ''}); setStudentFound(null); }} />
              Our Student (Internal)
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input type="radio" checked={studentType === 'external'} onChange={() => { setStudentType('external'); setFormData({...formData, studentId: '', name: '', phone: ''}); }} />
              Out Student (External)
            </label>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            
            {studentType === 'internal' && (
              <div className="input-group">
                <label>Student ID *</label>
                <input type="text" value={formData.studentId} onChange={handleIdChange} placeholder="e.g. JAL-0001" required />
                {studentFound === true && <div style={{ color: 'green', fontSize: '0.8rem', marginTop: '0.2rem' }}>Student found! Automatically filled.</div>}
                {studentFound === false && <div style={{ color: 'red', fontSize: '0.8rem', marginTop: '0.2rem' }}>Student not found.</div>}
              </div>
            )}

            <div className="input-group">
              <label>Name *</label>
              <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required readOnly={studentType === 'internal' && studentFound} />
            </div>

            <div className="input-group">
              <label>Phone Number *</label>
              <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required readOnly={studentType === 'internal' && studentFound} />
            </div>

            <div className="input-group">
              <label>Date *</label>
              <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required />
            </div>

            <div className="input-group">
              <label>Test Fee (৳) - 0 for Free</label>
              <input type="number" value={formData.fee} onChange={e => setFormData({...formData, fee: e.target.value})} required />
            </div>

            {parseFloat(formData.fee) > 0 && (
              <div className="input-group">
                <label>Payment Method</label>
                <select value={formData.paymentMethod} onChange={e => setFormData({...formData, paymentMethod: e.target.value})}>
                  <option>Cash</option>
                  <option>bKash</option>
                  <option>Nagad</option>
                </select>
              </div>
            )}

            {studentType === 'internal' && studentFound && (
              <div style={{ gridColumn: '1 / -1', padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--status-paid)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--status-paid)' }}>
                <strong>Test History:</strong> This student has taken {previousTestsCount} mock test(s) before.
              </div>
            )}

            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button type="submit" className="btn btn-primary" disabled={studentType === 'internal' && !studentFound}>Save Mock Test</button>
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
              <th>Student Details</th>
              <th>Fee Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {tests.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>No mock tests recorded yet.</td></tr>
            ) : tests.map(test => (
              <tr key={test.id}>
                <td>{test.date}</td>
                <td>
                  <span className={`status-badge ${test.studentType === 'internal' ? 'status-paid' : 'status-partial'}`}>
                    {test.studentType === 'internal' ? 'Internal' : 'External'}
                  </span>
                </td>
                <td>
                  <div style={{ fontWeight: 'bold' }}>{test.name}</div>
                  <div className="text-muted" style={{ fontSize: '0.85rem' }}>{test.phone}</div>
                  {test.studentType === 'internal' && <div style={{ fontSize: '0.8rem', color: 'var(--accent-primary)' }}>ID: {test.studentId}</div>}
                </td>
                <td>
                  {test.fee > 0 ? (
                    <span style={{ color: 'var(--status-paid)', fontWeight: 'bold' }}>Paid ৳{test.fee} ({test.paymentMethod})</span>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>Free Test</span>
                  )}
                </td>
                <td style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-primary" style={{ padding: '0.4rem', fontSize: '0.8rem' }} onClick={() => setLastTest(test)}>
                    <FileText size={16} /> Slip
                  </button>
                  <button className="btn btn-secondary" style={{ padding: '0.4rem', fontSize: '0.8rem', color: 'var(--status-due)', borderColor: 'var(--status-due-bg)' }} onClick={() => handleDelete(test.id)}>
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

export default MockTests;
