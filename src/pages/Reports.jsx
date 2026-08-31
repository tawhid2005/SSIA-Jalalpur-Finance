import React, { useState, useEffect } from 'react';
import { db } from '../db';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { Printer } from 'lucide-react';
import PrintHeader from '../components/PrintHeader';

const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

const Reports = () => {
  const [filterType, setFilterType] = useState('monthly'); // lifetime, yearly, monthly
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString().padStart(2, '0'));
  
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalNetFees: 0, // Dues generated
    totalFeeCollection: 0,
    totalOtherIncome: 0,
    totalMockTestIncome: 0,
    totalIncome: 0,
    totalGeneralExpenses: 0,
    totalMarketingExpenses: 0,
    totalSalaryPaid: 0,
    totalExpenses: 0,
    netProfit: 0,
    currentTotalDue: 0
  });

  const [salesData, setSalesData] = useState([]);

  const handlePrint = () => {
    window.print();
  };

  const loadReports = async () => {
    // 1. Fetch all data
    const [
      allStudents,
      allFeeCollections,
      allIncomes,
      allExpenses,
      allMarketing,
      allSalaries,
      allMockTests
    ] = await Promise.all([
      db.students.toArray(),
      db.fee_collections.toArray(),
      db.incomes.toArray(),
      db.expenses.toArray(),
      db.marketing.toArray(),
      db.teacher_salary.toArray(),
      db.mock_tests.toArray()
    ]);

    // 2. Filter functions
    const isDateInFilter = (dateStr) => {
      if (!dateStr) return false;
      if (filterType === 'lifetime') return true;
      if (filterType === 'yearly') return dateStr.startsWith(selectedYear);
      if (filterType === 'monthly') return dateStr.startsWith(`${selectedYear}-${selectedMonth}`);
      return false;
    };

    // 3. Filter arrays
    const fStudents = allStudents.filter(s => isDateInFilter(s.admissionDate));
    const fFeeCollections = allFeeCollections.filter(f => isDateInFilter(f.date));
    const fIncomes = allIncomes.filter(i => isDateInFilter(i.date));
    const fExpenses = allExpenses.filter(e => isDateInFilter(e.date));
    const fMarketing = allMarketing.filter(m => isDateInFilter(m.date));
    const fSalaries = allSalaries.filter(s => isDateInFilter(s.date || (s.month + '-01'))); // Salaries might just have month
    const fMockTests = allMockTests.filter(m => isDateInFilter(m.date));

    // 4. Calculate Metrics
    const totalStudents = fStudents.length;
    let totalNetFees = 0;
    fStudents.forEach(s => totalNetFees += (s.netFee || 0));

    // Total Due is calculated from Lifetime students, not filtered, because dues carry over.
    // Wait, the user wants to see "koto due thaklo". We can show "Dues generated this period" or "Lifetime outstanding dues".
    // Let's show "Lifetime Outstanding Dues" at the bottom as it's the actual actionable number.
    let currentTotalDue = 0;
    allStudents.forEach(s => currentTotalDue += (s.due || 0));

    const totalFeeCollection = fFeeCollections.reduce((sum, f) => sum + (f.currentPayment || 0), 0);
    const pureOtherIncome = fIncomes.filter(i => i.category !== 'Mock Test Fee').reduce((sum, i) => sum + (i.amount || 0), 0);
    const totalMockTestIncome = fMockTests.reduce((sum, m) => sum + (m.fee || 0), 0);
    
    const totalIncome = totalFeeCollection + pureOtherIncome + totalMockTestIncome;

    const totalGeneralExpenses = fExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const totalMarketingExpenses = fMarketing.reduce((sum, m) => sum + (m.amount || 0), 0);
    const totalSalaryPaid = fSalaries.reduce((sum, s) => sum + (s.paid || s.amount || 0), 0);
    
    const totalExpenses = totalGeneralExpenses + totalMarketingExpenses + totalSalaryPaid;
    const netProfit = totalIncome - totalExpenses;

    setStats({
      totalStudents,
      totalNetFees,
      totalFeeCollection,
      totalOtherIncome: pureOtherIncome,
      totalMockTestIncome: totalMockTestIncome,
      totalIncome,
      totalGeneralExpenses,
      totalMarketingExpenses,
      totalSalaryPaid,
      totalExpenses,
      netProfit,
      currentTotalDue
    });

    // 5. Generate Sales Trend Data
    generateTrendData(allFeeCollections, allIncomes);
  };

  const generateTrendData = (fees, incomes) => {
    let trend = [];
    if (filterType === 'yearly' || filterType === 'lifetime') {
      // Group by Month (Jan-Dec) for the selected year
      const yearToUse = filterType === 'yearly' ? selectedYear : new Date().getFullYear().toString();
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      trend = months.map((m, index) => {
        const monthNum = (index + 1).toString().padStart(2, '0');
        const prefix = `${yearToUse}-${monthNum}`;
        const monthFees = fees.filter(f => f.date && f.date.startsWith(prefix)).reduce((sum, f) => sum + (f.currentPayment || 0), 0);
        const monthIncomes = incomes.filter(i => i.date && i.date.startsWith(prefix)).reduce((sum, i) => sum + (i.amount || 0), 0);
        return { name: m, Sales: monthFees + monthIncomes };
      });
    } else {
      // Monthly - Group by week or days? Let's just group by weeks (Week 1, 2, 3, 4)
      trend = [1, 2, 3, 4].map(w => ({ name: `Week ${w}`, Sales: 0 }));
      const prefix = `${selectedYear}-${selectedMonth}`;
      
      const combined = [
        ...fees.filter(f => f.date && f.date.startsWith(prefix)).map(f => ({ date: f.date, amount: f.currentPayment || 0 })),
        ...incomes.filter(i => i.date && i.date.startsWith(prefix)).map(i => ({ date: i.date, amount: i.amount || 0 }))
      ];

      combined.forEach(item => {
        const day = parseInt(item.date.split('-')[2]);
        let week = Math.ceil(day / 7) - 1;
        if (week > 3) week = 3;
        trend[week].Sales += item.amount;
      });
    }
    setSalesData(trend);
  };

  useEffect(() => {
    loadReports();
  }, [filterType, selectedYear, selectedMonth]);

  const expenseData = [
    { name: 'General', value: stats.totalGeneralExpenses },
    { name: 'Marketing', value: stats.totalMarketingExpenses },
    { name: 'Salary', value: stats.totalSalaryPaid }
  ];

  let reportTitle = 'Lifetime Financial Report';
  if (filterType === 'yearly') reportTitle = `Yearly Financial Report - ${selectedYear}`;
  if (filterType === 'monthly') reportTitle = `Monthly Financial Report - ${selectedYear}-${selectedMonth}`;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }} className="print-hide">
        <div>
          <h1>Advanced Financial Reports</h1>
          <p className="text-muted">Track your sales, income, and losses by month or year</p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          
          <div className="glass-panel" style={{ padding: '0.5rem 1rem', display: 'flex', gap: '1rem' }}>
            <select className="btn btn-secondary" value={filterType} onChange={e => setFilterType(e.target.value)} style={{ padding: '0.5rem' }}>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
              <option value="lifetime">Lifetime</option>
            </select>

            {filterType !== 'lifetime' && (
              <select className="btn btn-secondary" value={selectedYear} onChange={e => setSelectedYear(e.target.value)} style={{ padding: '0.5rem' }}>
                <option value="2024">2024</option>
                <option value="2025">2025</option>
                <option value="2026">2026</option>
                <option value="2027">2027</option>
              </select>
            )}

            {filterType === 'monthly' && (
              <select className="btn btn-secondary" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} style={{ padding: '0.5rem' }}>
                <option value="01">January</option>
                <option value="02">February</option>
                <option value="03">March</option>
                <option value="04">April</option>
                <option value="05">May</option>
                <option value="06">June</option>
                <option value="07">July</option>
                <option value="08">August</option>
                <option value="09">September</option>
                <option value="10">October</option>
                <option value="11">November</option>
                <option value="12">December</option>
              </select>
            )}
          </div>

          <button className="btn btn-primary" onClick={handlePrint}>
            <Printer size={18} /> Print PDF
          </button>
        </div>
      </div>

      <div id="printable-area" style={{ background: 'var(--bg-main)', padding: '1rem', color: 'var(--text-primary)' }}>
        
        <div className="print-only" style={{ display: 'none' }}></div>
        <div style={{ display: 'none' }} className="show-on-print">
           <PrintHeader title={reportTitle} />
        </div>
        
        <style>
          {`
            @media print {
              .show-on-print { display: block !important; }
              .dashboard-grid { grid-template-columns: 1fr !important; }
              .print-hide { display: none !important; }
            }
          `}
        </style>

        <h3 style={{ marginBottom: '1.5rem', textAlign: 'center', color: 'var(--accent-primary)' }} className="print-hide">
          {reportTitle}
        </h3>

        <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
          
          <div className="glass-panel">
            <h3 style={{ marginBottom: '1.5rem', color: 'var(--accent-primary)', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>Financial Summary</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <h4 className="text-muted" style={{ marginBottom: '1rem' }}>INCOME (SALES)</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--status-paid)' }}>
                  <span>Fee Collection:</span>
                  <strong>৳{stats.totalFeeCollection.toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span>Mock Test Income:</span>
                  <strong>৳{stats.totalMockTestIncome.toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span>Other Income:</span>
                  <strong>৳{stats.totalOtherIncome.toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-light)', fontSize: '1.1rem' }}>
                  <strong>TOTAL INCOME:</strong>
                  <strong style={{ color: 'var(--status-paid)' }}>৳{stats.totalIncome.toLocaleString()}</strong>
                </div>
              </div>

              <div>
                <h4 className="text-muted" style={{ marginBottom: '1rem' }}>EXPENSES</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span>General Expenses:</span>
                  <strong>৳{stats.totalGeneralExpenses.toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span>Marketing Expenses:</span>
                  <strong>৳{stats.totalMarketingExpenses.toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span>Teacher Salary Paid:</span>
                  <strong>৳{stats.totalSalaryPaid.toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-light)', fontSize: '1.1rem' }}>
                  <strong>TOTAL EXPENSES:</strong>
                  <strong style={{ color: 'var(--status-due)' }}>৳{stats.totalExpenses.toLocaleString()}</strong>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="stat-card glass" style={{ borderColor: stats.netProfit >= 0 ? 'var(--status-paid)' : 'var(--status-due)', borderWidth: '2px', borderStyle: 'solid', background: stats.netProfit < 0 ? 'rgba(239, 68, 68, 0.05)' : 'rgba(16, 185, 129, 0.05)' }}>
              <div className="stat-title" style={{ fontSize: '1rem' }}>
                {stats.netProfit >= 0 ? 'Net Profit (লাভ)' : 'Net Loss (লজ)'}
              </div>
              <div className="stat-value" style={{ color: stats.netProfit >= 0 ? 'var(--status-paid)' : 'var(--status-due)', fontSize: '2.5rem' }}>
                {stats.netProfit < 0 ? '-' : ''}৳{Math.abs(stats.netProfit).toLocaleString()}
              </div>
            </div>

            <div className="glass-panel" style={{ flex: 1 }}>
              <h4 style={{ marginBottom: '1rem', textAlign: 'center' }}>Expense Distribution</h4>
              {stats.totalExpenses > 0 ? (
                <div style={{ width: '100%', height: '180px' }} className="print-hide">
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={expenseData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={5} dataKey="value">
                        {expenseData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(value) => `৳${value.toLocaleString()}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div style={{ height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>No expenses recorded</div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                <span style={{color: COLORS[0]}}>● General</span>
                <span style={{color: COLORS[1]}}>● Marketing</span>
                <span style={{color: COLORS[2]}}>● Salary</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sales Trend Chart */}
        <div className="glass-panel print-hide" style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem', color: 'var(--accent-primary)' }}>Sales / Income Trend ({filterType === 'monthly' ? 'Weekly' : 'Monthly'})</h3>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer>
              <BarChart data={salesData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                <XAxis dataKey="name" stroke="var(--text-muted)" />
                <YAxis stroke="var(--text-muted)" />
                <Tooltip formatter={(value) => `৳${value.toLocaleString()}`} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                <Legend />
                <Bar dataKey="Sales" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
          <h2 style={{ color: 'var(--status-due)', marginBottom: '0.5rem' }}>Lifetime Outstanding Dues: ৳{stats.currentTotalDue.toLocaleString()}</h2>
          <p className="text-muted" style={{ margin: 0 }}>This is the total amount currently unpaid by all students across all time.</p>
        </div>
      </div>
    </div>
  );
};

export default Reports;
