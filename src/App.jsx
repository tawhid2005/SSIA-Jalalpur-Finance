import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  AlertCircle,
  TrendingUp, 
  TrendingDown, 
  Megaphone, 
  Briefcase,
  PieChart,
  FileText,
  LogOut,
  Menu,
  X,
  MapPin,
  Phone,
  Clock
} from 'lucide-react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import MockTests from './pages/MockTests';
import Fees from './pages/Fees';
import DueManagement from './pages/DueManagement';
import Income from './pages/Income';
import Expenses from './pages/Expenses';
import Marketing from './pages/Marketing';
import TeacherSalary from './pages/TeacherSalary';
import Attendance from './pages/Attendance';
import Reports from './pages/Reports';
import './index.css';

const Sidebar = ({ onLogout, isMobileOpen, setMobileOpen }) => {
  const location = useLocation();
  
  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/students', icon: Users, label: 'Students Master' },
    { path: '/mock-tests', icon: FileText, label: 'Mock Tests' },
    { path: '/fees', icon: CreditCard, label: 'Fee Collection' },
    { path: '/due-management', icon: AlertCircle, label: 'Due Management' },
    { path: '/income', icon: TrendingUp, label: 'Other Income' },
    { path: '/expenses', icon: TrendingDown, label: 'General Expenses' },
    { path: '/marketing', icon: Megaphone, label: 'Marketing Expenses' },
    { path: '/salary', icon: Briefcase, label: 'Teacher Salary' },
    { path: '/attendance', icon: Clock, label: 'Staff Attendance' },
    { path: '/reports', icon: PieChart, label: 'Lifetime Reports & P&L' }
  ];

  return (
    <div className={`sidebar print-hide ${isMobileOpen ? 'open' : ''}`} style={{
      width: '270px',
      height: '100vh',
      backgroundColor: 'var(--bg-panel)',
      borderRight: '1px solid var(--border-light)',
      padding: '1.5rem 1rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      overflowY: 'auto'
    }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }} className="mobile-only">
        <button className="btn-icon" onClick={() => setMobileOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)' }}>
          <X size={24} />
        </button>
      </div>

      <div style={{ padding: '0 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1rem' }}>
        <img src="/logo.png" alt="Shah Sultan Logo" style={{ width: '100%', maxWidth: '200px', height: 'auto', borderRadius: '8px', objectFit: 'contain', background: 'white', padding: '0.75rem', marginBottom: '1rem' }} />
        
        <div style={{ 
          width: '100%', 
          background: 'var(--bg-main)', 
          padding: '0.75rem', 
          borderRadius: 'var(--radius-sm)', 
          border: '1px solid var(--border-light)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          fontSize: '0.8rem',
          color: 'var(--text-muted)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Phone size={14} style={{ color: 'var(--accent-primary)' }} />
            <span>+880 1337-993522</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
            <MapPin size={14} style={{ color: 'var(--accent-primary)', flexShrink: 0, marginTop: '2px' }} />
            <span style={{ lineHeight: '1.3' }}>Jalalpur Bazar, Collage Road, Sylhet</span>
          </div>
        </div>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                textDecoration: 'none',
                color: isActive ? 'white' : 'var(--text-secondary)',
                backgroundColor: isActive ? 'var(--accent-primary)' : 'transparent',
                transition: 'all 0.2s',
                fontWeight: isActive ? '600' : '500',
                fontSize: '0.9rem'
              }}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
        <button 
          className="nav-link" 
          onClick={onLogout} 
          style={{ width: '100%', background: 'transparent', border: 'none', textAlign: 'left', cursor: 'pointer', color: 'var(--status-due)' }}
        >
          <LogOut size={20} /> Logout
        </button>
      </div>
    </div>
  );
};

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const auth = localStorage.getItem('isAuthenticated');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = () => {
    localStorage.setItem('isAuthenticated', 'true');
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Router>
      <div className="app-container">
        {isMobileMenuOpen && (
          <div className="mobile-overlay" onClick={() => setIsMobileMenuOpen(false)}></div>
        )}
        <Sidebar onLogout={handleLogout} isMobileOpen={isMobileMenuOpen} setMobileOpen={setIsMobileMenuOpen} />
        
        <main className="main-content">
          <div className="mobile-header mobile-only" style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <img src="/pwa-icon.png" alt="Logo" style={{ width: '32px', height: '32px', borderRadius: '4px', background: 'white', padding: '2px' }} />
              <span style={{ fontWeight: 'bold' }}>SSIA Admin</span>
            </div>
            <button onClick={() => setIsMobileMenuOpen(true)} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)' }}>
              <Menu size={28} />
            </button>
          </div>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/students" element={<Students />} />
            <Route path="/mock-tests" element={<MockTests />} />
            <Route path="/fees" element={<Fees />} />
            <Route path="/due-management" element={<DueManagement />} />
            <Route path="/income" element={<Income />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/marketing" element={<Marketing />} />
            <Route path="/salary" element={<TeacherSalary />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/reports" element={<Reports />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
