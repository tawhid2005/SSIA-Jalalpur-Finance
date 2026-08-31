import React, { useState, useEffect } from 'react';
import { db } from '../db';
import { CreditCard, Search } from 'lucide-react';

const Fees = () => {
  const [fees, setFees] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [searchId, setSearchId] = useState('');
  const [studentInfo, setStudentInfo] = useState(null);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    receiptNo: `REC-${Date.now().toString().slice(-6)}`,
    currentPayment: '',
    paymentMethod: 'Cash'
  });

  const loadFees = async () => {
    const allFees = await db.fee_collections.toArray();
    setFees(allFees.reverse());
  };

  useEffect(() => {
    loadFees();
  }, []);

  const handleSearch = async () => {
    if (!searchId) return;
    const student = await db.students.get(searchId.toUpperCase());
    
    if (student) {
      setStudentInfo(student);
      setError('');
    } else {
      setStudentInfo(null);
      setError('Student not found. Please check the ID.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!studentInfo) return;

    const paymentAmount = parseFloat(formData.currentPayment) || 0;
    if (paymentAmount <= 0) return;

    const previousPaid = studentInfo.totalPaid || 0;
    const totalPaidAfter = previousPaid + paymentAmount;
    const remainingDue = Math.max(0, studentInfo.netFee - totalPaidAfter);
    
    let status = 'DUE';
    if (remainingDue === 0) status = 'PAID';
    else if (totalPaidAfter > 0) status = 'PARTIAL';

    const feeRecord = {
      date: formData.date,
      receiptNo: formData.receiptNo,
      studentId: studentInfo.id,
      course: studentInfo.course,
      netFee: studentInfo.netFee,
      previousPaid: previousPaid,
      currentPayment: paymentAmount,
      totalPaidAfter: totalPaidAfter,
      remainingDue: remainingDue,
      status: status,
      paymentMethod: formData.paymentMethod,
      timestamp: new Date().getTime()
    };

    // 1. Add to fee_collections
    await db.fee_collections.add(feeRecord);

    // 2. Update Students Master
    await db.students.update(studentInfo.id, {
      totalPaid: totalPaidAfter,
      due: remainingDue,
      status: status
    });

    setFormData({
      date: new Date().toISOString().split('T')[0],
      receiptNo: `REC-${Date.now().toString().slice(-6)}`,
      currentPayment: '',
      paymentMethod: 'Cash'
    });
    setStudentInfo(null);
    setSearchId('');
    setShowForm(false);
    loadFees();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>Fee Collection</h1>
          <p className="text-muted">Process installments and track student payments</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <CreditCard size={18} /> {showForm ? 'Close Collection' : 'Collect Fee'}
        </button>
      </div>

      {showForm && (
        <div className="glass-panel" style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem', color: 'var(--accent-primary)' }}>New Fee Collection</h3>
          
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
            <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
              <label>Student ID</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input 
                  type="text" 
                  placeholder="e.g. JAL-0001" 
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  style={{ flex: 1, textTransform: 'uppercase' }}
                />
                <button className="btn btn-secondary" onClick={handleSearch}>
                  <Search size={18} />
                </button>
              </div>
            </div>
          </div>

          {error && <div style={{ color: 'var(--status-due)', marginBottom: '1rem' }}>{error}</div>}

          {studentInfo && (
            <div style={{ padding: '1.5rem', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-md)', marginBottom: '2rem', border: '1px solid var(--border-light)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                <div><span className="text-muted" style={{fontSize: '0.8rem'}}>Name:</span><br/><strong>{studentInfo.name}</strong></div>
                <div><span className="text-muted" style={{fontSize: '0.8rem'}}>Course:</span><br/>{studentInfo.course}</div>
                <div><span className="text-muted" style={{fontSize: '0.8rem'}}>Net Fee:</span><br/>৳{studentInfo.netFee}</div>
                <div><span className="text-muted" style={{fontSize: '0.8rem'}}>Previous Paid:</span><br/>৳{studentInfo.totalPaid}</div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={{ padding: '0.5rem 1rem', display: 'inline-block', backgroundColor: 'var(--status-due-bg)', color: 'var(--status-due)', borderRadius: 'var(--radius-md)', fontWeight: '600' }}>
                    Current Due: ৳{studentInfo.due}
                  </div>
                </div>
              </div>
            </div>
          )}

          {studentInfo && (
            <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="input-group">
                <label>Date</label>
                <input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} required />
              </div>
              <div className="input-group">
                <label>Receipt No</label>
                <input type="text" value={formData.receiptNo} onChange={(e) => setFormData({...formData, receiptNo: e.target.value})} required />
              </div>
              <div className="input-group">
                <label>Current Payment (৳) *</label>
                <input type="number" value={formData.currentPayment} onChange={(e) => setFormData({...formData, currentPayment: e.target.value})} max={studentInfo.due} required />
              </div>
              <div className="input-group">
                <label>Payment Method</label>
                <select value={formData.paymentMethod} onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}>
                  <option>Cash</option>
                  <option>bKash</option>
                  <option>Nagad</option>
                  <option>Bank</option>
                  <option>Online</option>
                </select>
              </div>

              <div style={{ gridColumn: '1 / -1', marginTop: '1rem' }}>
                <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', border: '1px solid var(--status-paid)' }}>
                  <div><strong>Total Paid After:</strong> ৳{studentInfo.totalPaid + (parseFloat(formData.currentPayment) || 0)}</div>
                  <div><strong>Remaining Due:</strong> ৳{Math.max(0, studentInfo.due - (parseFloat(formData.currentPayment) || 0))}</div>
                </div>
              </div>

              <div style={{ gridColumn: '1 / -1', marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="btn btn-primary" disabled={studentInfo.due === 0}>Process Payment</button>
              </div>
            </form>
          )}
        </div>
      )}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Receipt</th>
              <th>Student ID</th>
              <th>Course</th>
              <th>Prev Paid</th>
              <th>Payment</th>
              <th>Total After</th>
              <th>Remaining Due</th>
            </tr>
          </thead>
          <tbody>
            {fees.length === 0 ? (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>No fee collections yet.</td></tr>
            ) : fees.map(fee => (
              <tr key={fee.id}>
                <td>{fee.date}</td>
                <td className="text-muted">{fee.receiptNo}</td>
                <td style={{ fontWeight: '600', color: 'var(--accent-primary)' }}>{fee.studentId}</td>
                <td>{fee.course}</td>
                <td>৳{fee.previousPaid}</td>
                <td style={{ fontWeight: '600', color: 'var(--status-paid)' }}>+৳{fee.currentPayment}</td>
                <td>৳{fee.totalPaidAfter}</td>
                <td style={{ color: fee.remainingDue > 0 ? 'var(--status-due)' : 'inherit' }}>৳{fee.remainingDue}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Fees;
