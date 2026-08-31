import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { Users, CreditCard, TrendingUp, DollarSign, UserPlus, BookOpen, PlusCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { db } from '../db';

const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalIncome: 0,
    totalDues: 0,
    netProfit: 0
  });

  const [courseData, setCourseData] = useState([]);
  const [recentStudents, setRecentStudents] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      const [students, incomes, expenses, marketing, salaries, mock_tests] = await Promise.all([
        db.students.toArray(),
        db.incomes.toArray(),
        db.expenses.toArray(),
        db.marketing.toArray(),
        db.teacher_salary.toArray(),
        db.mock_tests.toArray()
      ]);

      const totalStudents = students.length;
      
      let totalDues = 0;
      let totalFeeIncome = 0;
      const courseCount = {};

      students.forEach(s => {
        totalDues += (s.due || 0);
        totalFeeIncome += (s.totalPaid || 0);
        
        if (s.course) {
          courseCount[s.course] = (courseCount[s.course] || 0) + 1;
        }
      });

      const totalOtherIncome = incomes
        .filter(item => item.category !== 'Mock Test Fee')
        .reduce((sum, item) => sum + (item.amount || 0), 0);
      const totalMockTestIncome = mock_tests.reduce((sum, item) => sum + (item.fee || 0), 0);
      const totalIncome = totalFeeIncome + totalOtherIncome + totalMockTestIncome;

      const totalGeneralExpenses = expenses.reduce((sum, item) => sum + (item.amount || 0), 0);
      const totalMarketingExpenses = marketing.reduce((sum, item) => sum + (item.amount || 0), 0);
      const totalSalaryPaid = salaries.reduce((sum, item) => sum + (item.paid || 0), 0);
      const totalExpenses = totalGeneralExpenses + totalMarketingExpenses + totalSalaryPaid;

      const netProfit = totalIncome - totalExpenses;

      const formattedCourseData = Object.keys(courseCount).map(course => ({
        name: course,
        students: courseCount[course]
      }));

      setStats({
        totalStudents,
        totalIncome,
        totalDues,
        netProfit
      });

      setCourseData(formattedCourseData);

      // Marketing Breakdown
      const digitalMarketing = marketing.filter(m => m.type === 'Digital Marketing').reduce((s, i) => s + (i.amount || 0), 0);
      const physicalMarketing = marketing.filter(m => m.type === 'Physical Marketing').reduce((s, i) => s + (i.amount || 0), 0);
      setMarketingData([
        { name: 'Digital Marketing', value: digitalMarketing },
        { name: 'Physical Marketing', value: physicalMarketing }
      ]);

      // Fetch Recent 5 Students
      const recent = students
        .sort((a, b) => new Date(b.admissionDate || 0) - new Date(a.admissionDate || 0))
        .slice(0, 5);
      setRecentStudents(recent);
    };

    fetchStats();
  }, []);

  const [marketingData, setMarketingData] = useState([
    { name: 'Digital', value: 0 },
    { name: 'Physical', value: 0 }
  ]);

  return (
    <div className="dashboard-page">
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.5rem', fontSize: '1.8rem' }}>Welcome back, Admin 👋</h1>
          <p className="text-muted">Here is what's happening with your academy today. <b>{new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</b></p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <Link to="/students" className="quick-action-btn">
          <UserPlus size={18} /> Add Student
        </Link>
        <Link to="/fees" className="quick-action-btn">
          <CreditCard size={18} /> Collect Fee
        </Link>
        <Link to="/mock-tests" className="quick-action-btn">
          <BookOpen size={18} /> Add Mock Test
        </Link>
        <Link to="/expenses" className="quick-action-btn">
          <PlusCircle size={18} /> Record Expense
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid-cards">
        <div className="stat-card glass">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div className="stat-title">Total Students</div>
            <div style={{ padding: '0.5rem', backgroundColor: 'var(--accent-glow)', borderRadius: 'var(--radius-md)', color: 'var(--accent-primary)' }}>
              <Users size={20} />
            </div>
          </div>
          <div className="stat-value">{stats.totalStudents}</div>
        </div>

        <div className="stat-card glass success">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div className="stat-title">Total Income (Fees)</div>
            <div style={{ padding: '0.5rem', backgroundColor: 'var(--status-paid-bg)', borderRadius: 'var(--radius-md)', color: 'var(--status-paid)' }}>
              <DollarSign size={20} />
            </div>
          </div>
          <div className="stat-value">৳{stats.totalIncome.toLocaleString()}</div>
        </div>

        <div className="stat-card glass danger">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div className="stat-title">Current Total Due</div>
            <div style={{ padding: '0.5rem', backgroundColor: 'var(--status-due-bg)', borderRadius: 'var(--radius-md)', color: 'var(--status-due)' }}>
              <CreditCard size={20} />
            </div>
          </div>
          <div className="stat-value">৳{stats.totalDues.toLocaleString()}</div>
        </div>

        <div className="stat-card glass warning">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div className="stat-title">Net Profit (Lifetime)</div>
            <div style={{ padding: '0.5rem', backgroundColor: 'var(--status-partial-bg)', borderRadius: 'var(--radius-md)', color: 'var(--status-partial)' }}>
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="stat-value">৳{stats.netProfit.toLocaleString()}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
        
        {/* Recent Activity Mini Table */}
        <div className="glass-panel" style={{ gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0 }}>Recent Admissions</h3>
            <Link to="/students" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              View All <ArrowRight size={14} />
            </Link>
          </div>
          <div className="table-container" style={{ marginTop: 0 }}>
            <table className="mini-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Student Name</th>
                  <th>ID</th>
                  <th>Course</th>
                </tr>
              </thead>
              <tbody>
                {recentStudents.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No recent admissions.</td>
                  </tr>
                ) : (
                  recentStudents.map((s, i) => (
                    <tr key={s.id || i}>
                      <td>{s.admissionDate ? new Date(s.admissionDate).toLocaleDateString() : 'N/A'}</td>
                      <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{s.name}</td>
                      <td>{s.studentId}</td>
                      <td>
                        <span style={{ 
                          padding: '0.25rem 0.5rem', 
                          background: 'rgba(59, 130, 246, 0.1)', 
                          color: 'var(--accent-primary)', 
                          borderRadius: '12px', 
                          fontSize: '0.75rem' 
                        }}>
                          {s.course}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Charts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '2rem' }} className="form-grid">
        
        <div className="glass-panel">
          <h3>Course-wise Students</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={courseData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                <XAxis dataKey="name" stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)' }} />
                <YAxis stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-panel)', borderColor: 'var(--border-light)', borderRadius: 'var(--radius-md)' }}
                  itemStyle={{ color: 'var(--text-primary)' }}
                />
                <Bar dataKey="students" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel">
          <h3>Marketing Expense Breakdown</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={marketingData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {marketingData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => `৳${value.toLocaleString()}`}
                  contentStyle={{ backgroundColor: 'var(--bg-panel)', borderColor: 'var(--border-light)', borderRadius: 'var(--radius-md)' }}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
