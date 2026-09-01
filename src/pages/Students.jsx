import React, { useState, useEffect, useRef } from 'react';
import { db, generateStudentId } from '../db';
import { UserPlus, Search, Printer, X, FileText, Edit, Trash2 } from 'lucide-react';
import Confetti from 'react-confetti';
import PrintHeader from '../components/PrintHeader';

const Students = () => {
  const [students, setStudents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [lastAdmitted, setLastAdmitted] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    guardianName: '',
    guardianPhone: '',
    phone: '',
    location: '',
    course: 'IELTS Regular',
    batch: '',
    admissionDate: new Date().toISOString().split('T')[0],
    courseFee: '',
    discount: '0',
    admissionPayment: '',
    paymentMethod: 'Cash',
    nextDueDate: '',
    notes: ''
  });

  const loadStudents = async () => {
    const allStudents = await db.students.toArray();
    setStudents(allStudents.reverse());
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'course' && value === 'Mock Test') {
      setFormData({ ...formData, [name]: value, batch: '' });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const calculateFinancials = () => {
    const courseFee = parseFloat(formData.courseFee) || 0;
    const discount = parseFloat(formData.discount) || 0;
    const admissionPayment = parseFloat(formData.admissionPayment) || 0;
    
    const netFee = courseFee - discount;
    const totalPaid = admissionPayment;
    const due = Math.max(0, netFee - totalPaid);
    
    let status = 'DUE';
    if (due === 0) status = 'PAID';
    else if (totalPaid > 0) status = 'PARTIAL';

    return { netFee, totalPaid, due, status };
  };



  const handleSubmit = async (e) => {
    e.preventDefault();
    const financials = calculateFinancials();

    if (editingId) {
      const existingStudent = await db.students.get(editingId);
      const updatedStudent = {
        ...existingStudent,
        ...formData,
        ...financials
      };
      
      // Instant UI update
      setStudents(prev => prev.map(s => s.id === editingId ? updatedStudent : s));
      
      await db.students.put(updatedStudent);
      setEditingId(null);
    } else {
      // Instant ID generation from local state
      let studentId = 'JAL-0001';
      if (students.length > 0 && students[0].id) {
        const lastNumber = parseInt(students[0].id.split('-')[1]);
        if (!isNaN(lastNumber)) {
          studentId = `JAL-${(lastNumber + 1).toString().padStart(4, '0')}`;
        }
      }

      const newStudent = {
        id: studentId,
        ...formData,
        ...financials,
        timestamp: new Date().getTime()
      };

      // Instant UI update
      setStudents(prev => [newStudent, ...prev]);

      // Background sync (fire and forget for instant response)
      db.students.add(newStudent).then(() => {
        if (financials.totalPaid > 0) {
          db.fee_collections.add({
            date: formData.admissionDate,
            receiptNo: `REC-ADM-${newStudent.id}`,
            studentId: newStudent.id,
            course: formData.course,
            netFee: financials.netFee,
            previousPaid: 0,
            currentPayment: financials.totalPaid,
            totalPaidAfter: financials.totalPaid,
            remainingDue: financials.due,
            status: financials.status,
            paymentMethod: formData.paymentMethod
          });
        }
      });

      setLastAdmitted(newStudent);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000); // Stop confetti after 5 seconds
    }
    
    setFormData({
      name: '', guardianName: '', guardianPhone: '', phone: '', location: '', course: 'IELTS Regular', batch: '', admissionDate: new Date().toISOString().split('T')[0], courseFee: '', discount: '0', admissionPayment: '', paymentMethod: 'Cash', nextDueDate: '', notes: ''
    });
    setShowForm(false);
  };

  const handleEdit = (student) => {
    setEditingId(student.id);
    setFormData({
      name: student.name,
      guardianName: student.guardianName || '',
      guardianPhone: student.guardianPhone || '',
      phone: student.phone,
      location: student.location || '',
      course: student.course,
      batch: student.batch || '',
      admissionDate: student.admissionDate || new Date().toISOString().split('T')[0],
      courseFee: student.courseFee || '',
      discount: student.discount || '0',
      admissionPayment: student.totalPaid || '', 
      paymentMethod: student.paymentMethod || 'Cash',
      nextDueDate: student.nextDueDate || '',
      notes: student.notes || ''
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await db.students.delete(deleteId);
      
      // Delete associated fee collections safely
      const allFees = await db.fee_collections.toArray();
      const studentFees = allFees.filter(f => f.studentId === deleteId);
      for (let f of studentFees) {
        await db.fee_collections.delete(f.id);
      }
      
      // Instant UI update
      setStudents(prev => prev.filter(s => s.id !== deleteId));
      setDeleteId(null);
    } catch (error) {
      console.error("Delete Error:", error);
      alert("Error deleting record: " + error.message);
    }
  };

  return (
    <div>
      {showConfetti && <Confetti width={window.innerWidth} height={window.innerHeight} recycle={false} numberOfPieces={500} />}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="print-modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel" style={{ width: '400px', maxWidth: '90%', background: 'var(--bg-panel)', textAlign: 'center' }}>
            <h3 style={{ color: 'var(--status-due)', marginBottom: '1rem' }}>Confirm Deletion</h3>
            <p>Are you sure you want to delete student <strong>{deleteId}</strong>? This will also remove their fee history. This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
              <button className="btn btn-secondary" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="btn btn-primary" style={{ backgroundColor: 'var(--status-due)' }} onClick={confirmDelete}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Admission Slip Modal */}
      {lastAdmitted && !showConfetti && (
        <div className="print-modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel print-modal" style={{ width: '600px', maxWidth: '90%', maxHeight: '90vh', overflowY: 'auto', background: 'white', color: 'black' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }} className="print-hide">
              <button className="btn btn-secondary" onClick={() => setLastAdmitted(null)}><X size={18} /> Close</button>
              <button className="btn btn-primary" onClick={() => window.print()}><Printer size={18} /> Print Admission Slip</button>
            </div>

            <div id="printable-area" style={{ padding: '2rem', background: 'white' }}>
              <PrintHeader title="ADMISSION SLIP" />
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '2rem', fontSize: '1.1rem' }}>
                <div><strong>Student ID:</strong> {lastAdmitted.id}</div>
                <div><strong>Date:</strong> {lastAdmitted.admissionDate}</div>
                <div><strong>Name:</strong> {lastAdmitted.name}</div>
                <div><strong>Student Phone:</strong> {lastAdmitted.phone}</div>
                <div><strong>Guardian Name:</strong> {lastAdmitted.guardianName || 'N/A'}</div>
                <div><strong>Guardian Phone:</strong> {lastAdmitted.guardianPhone || 'N/A'}</div>
                <div><strong>Location:</strong> {lastAdmitted.location || 'N/A'}</div>
                <div><strong>Course:</strong> {lastAdmitted.course}</div>
                <div><strong>Batch:</strong> {lastAdmitted.batch || 'N/A'}</div>
              </div>

              <div style={{ marginTop: '2rem', border: '1px solid #ccc', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid #ccc', background: '#f9f9f9' }}>
                  <span>Course Fee</span>
                  <span>৳{lastAdmitted.courseFee}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid #ccc' }}>
                  <span>Discount</span>
                  <span>৳{lastAdmitted.discount}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid #ccc', background: '#f9f9f9', fontWeight: 'bold' }}>
                  <span>Net Fee</span>
                  <span>৳{lastAdmitted.netFee}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid #ccc' }}>
                  <span>Admission Payment (Paid)</span>
                  <span>৳{lastAdmitted.totalPaid}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid #ccc', background: '#f9f9f9', fontWeight: 'bold', color: lastAdmitted.due > 0 ? 'red' : 'green' }}>
                  <span>Remaining Due</span>
                  <span>৳{lastAdmitted.due}</span>
                </div>
              </div>

              {lastAdmitted.due > 0 && lastAdmitted.nextDueDate && (
                <div style={{ marginTop: '2rem', padding: '1rem', background: '#ffeeee', border: '1px solid red', borderRadius: '8px', textAlign: 'center', color: 'red' }}>
                  <strong>Next Payment Due Date:</strong> {lastAdmitted.nextDueDate}
                </div>
              )}

              <div style={{ marginTop: '4rem', display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ borderTop: '1px solid #000', paddingTop: '0.5rem', width: '200px', textAlign: 'center' }}>Student Signature</div>
                <div style={{ borderTop: '1px solid #000', paddingTop: '0.5rem', width: '200px', textAlign: 'center' }}>Authorized Signature</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>Students Master</h1>
          <p className="text-muted">Manage admissions and lifetime student records</p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="input-group" style={{ flexDirection: 'row', alignItems: 'center', background: 'var(--bg-panel)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '0.25rem 0.75rem' }}>
            <Search size={18} className="text-muted" />
            <input 
              type="text" 
              placeholder="Search name, ID or phone..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ border: 'none', background: 'transparent', boxShadow: 'none', padding: '0.5rem', width: '220px' }}
            />
          </div>
          <button className="btn btn-primary" onClick={() => {
            if(showForm) {
              setShowForm(false);
              setEditingId(null);
              setFormData({ name: '', guardianName: '', guardianPhone: '', phone: '', location: '', course: 'IELTS Regular', batch: '', admissionDate: new Date().toISOString().split('T')[0], courseFee: '', discount: '0', admissionPayment: '', paymentMethod: 'Cash', nextDueDate: '', notes: '' });
            } else {
              setShowForm(true);
            }
          }}>
            <UserPlus size={18} /> {showForm ? 'Cancel' : 'New Admission'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="glass-panel" style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem', color: 'var(--accent-primary)' }}>
            {editingId ? `Edit Student: ${editingId}` : 'New Admission Form'}
          </h3>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-group">
              <label>Student Name *</label>
              <input type="text" name="name" value={formData.name} onChange={handleInputChange} required />
            </div>
            <div className="input-group">
              <label>Guardian Name</label>
              <input type="text" name="guardianName" value={formData.guardianName} onChange={handleInputChange} />
            </div>
            <div className="input-group">
              <label>Guardian Phone Number</label>
              <input type="tel" name="guardianPhone" value={formData.guardianPhone} onChange={handleInputChange} />
            </div>
            <div className="input-group">
              <label>Phone Number *</label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} required />
            </div>
            <div className="input-group">
              <label>Location (Address)</label>
              <input type="text" name="location" value={formData.location} onChange={handleInputChange} />
            </div>
            <div className="input-group">
              <label>Course *</label>
              <select name="course" value={formData.course} onChange={handleInputChange}>
                <option>IELTS Regular</option>
                <option>IELTS Intensive</option>
                <option>Spoken English</option>
                <option>IELTS Crash Course</option>
                <option>Kid's English</option>
                <option>Basic Computer</option>
                <option>Life Skill A1</option>
              </select>
            </div>
            <div className="input-group">
              <label>Batch</label>
              <input type="text" name="batch" value={formData.batch} onChange={handleInputChange} disabled={formData.course === 'Mock Test'} placeholder={formData.course === 'Mock Test' ? 'N/A for Mock Test' : ''} />
            </div>
            <div className="input-group">
              <label>Admission Date</label>
              <input type="date" name="admissionDate" value={formData.admissionDate} onChange={handleInputChange} required />
            </div>
            <div className="input-group">
              <label>Course Fee (৳) *</label>
              <input type="number" name="courseFee" value={formData.courseFee} onChange={handleInputChange} required />
            </div>
            <div className="input-group">
              <label>Discount (৳)</label>
              <input type="number" name="discount" value={formData.discount} onChange={handleInputChange} />
            </div>
            <div className="input-group">
              <label>Admission Payment (৳)</label>
              <input type="number" name="admissionPayment" value={formData.admissionPayment} onChange={handleInputChange} />
            </div>
            <div className="input-group">
              <label>Payment Method</label>
              <select name="paymentMethod" value={formData.paymentMethod} onChange={handleInputChange}>
                <option>Cash</option>
                <option>bKash</option>
                <option>Nagad</option>
                <option>Bank</option>
                <option>Online</option>
              </select>
            </div>
            <div className="input-group">
              <label>Next Payment Due Date (if due remaining)</label>
              <input type="date" name="nextDueDate" value={formData.nextDueDate} onChange={handleInputChange} />
            </div>
            
            <div style={{ gridColumn: '1 / -1', marginTop: '1rem' }}>
              <div style={{ padding: '1rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', border: '1px solid var(--accent-primary)' }}>
                <div><strong>Net Fee:</strong> ৳{((parseFloat(formData.courseFee) || 0) - (parseFloat(formData.discount) || 0))}</div>
                <div><strong>Due:</strong> ৳{Math.max(0, ((parseFloat(formData.courseFee) || 0) - (parseFloat(formData.discount) || 0)) - (parseFloat(formData.admissionPayment) || 0))}</div>
              </div>
            </div>

            <div style={{ gridColumn: '1 / -1', marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary">
                {editingId ? 'Save Changes' : 'Confirm Admission'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name & Phone</th>
              <th>Course</th>
              <th>Net Fee</th>
              <th>Total Paid</th>
              <th>Due</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {students.filter(student => 
              student.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              student.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              student.phone?.includes(searchQuery)
            ).length === 0 ? (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>No students found.</td></tr>
            ) : students.filter(student => 
              student.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              student.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              student.phone?.includes(searchQuery)
            ).map(student => (
              <tr key={student.id}>
                <td style={{ fontWeight: '600', color: 'var(--accent-primary)' }}>{student.id}</td>
                <td>
                  <div>{student.name}</div>
                  <div className="text-muted" style={{ fontSize: '0.8rem' }}>{student.phone}</div>
                </td>
                <td>{student.course}<br/><span className="text-muted" style={{ fontSize: '0.8rem' }}>Batch: {student.batch}</span></td>
                <td>৳{student.netFee}</td>
                <td>৳{student.totalPaid}</td>
                <td style={{ color: student.due > 0 ? 'var(--status-due)' : 'inherit', fontWeight: '500' }}>
                  ৳{student.due}
                  {student.due > 0 && student.nextDueDate && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Due: {student.nextDueDate}</div>}
                </td>
                <td>
                  <span className={`status-badge status-${(student.status || 'active').toLowerCase()}`}>
                    {student.status || 'Active'}
                  </span>
                </td>
                <td style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-secondary" style={{ padding: '0.4rem', fontSize: '0.8rem' }} onClick={() => handleEdit(student)}>
                    <Edit size={16} /> Edit
                  </button>
                  <button className="btn btn-primary" style={{ padding: '0.4rem', fontSize: '0.8rem' }} onClick={() => setLastAdmitted(student)}>
                    <FileText size={16} /> Slip
                  </button>
                  <button className="btn btn-secondary" style={{ padding: '0.4rem', fontSize: '0.8rem', color: 'var(--status-due)', borderColor: 'var(--status-due-bg)' }} onClick={() => handleDelete(student.id)}>
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

export default Students;
