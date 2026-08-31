import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { Users, CreditCard, TrendingUp, DollarSign } from 'lucide-react';
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
      let digital = 0;
      let physical = 0;
      marketing.forEach(m => {
        if (m.type === 'Digital Marketing') digital += (m.amount || 0);
        if (m.type === 'Physical Marketing') physical += (m.amount || 0);
      });
      
      setMarketingData([
        { name: 'Digital', value: digital },
        { name: 'Physical', value: physical }
      ]);
    };

    fetchStats();
  }, []);

  const [marketingData, setMarketingData] = useState([
    { name: 'Digital', value: 0 },
    { name: 'Physical', value: 0 }
  ]);

  return (
    <div className="dashboard-page">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>Dashboard Overview</h1>
        <p className="text-muted">Lifetime Financial & Admission Metrics</p>
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

      {/* Charts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        
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
