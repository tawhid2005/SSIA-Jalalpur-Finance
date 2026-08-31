import React, { useState } from 'react';
import { Lock, User, Loader2 } from 'lucide-react';
import { db } from '../db';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Custom Admin ID/Password
    if (username === 'ssiajalalpur@gmail.com' && password === 'SSIA@@##') {
      onLogin({ role: 'admin', username: 'admin', name: 'Administrator' });
      setIsLoading(false);
      return;
    } 
    
    // Check Staff Accounts
    try {
      const staffAccounts = await db.staff_accounts.toArray();
      const account = staffAccounts.find(a => 
        a.username.toLowerCase() === username.toLowerCase() && 
        a.password === password
      );

      if (account) {
        onLogin({ role: 'teacher', username: account.username, name: account.name });
      } else {
        setError('Invalid Username or Password');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred during login.');
    }
    
    setIsLoading(false);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', width: '100vw', background: 'var(--bg-main)' }}>
      <div className="glass-panel" style={{ width: '400px', maxWidth: '90%', padding: '3rem 2rem', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <img src="/logo.png" alt="Logo" style={{ width: '100%', maxWidth: '280px', height: 'auto', borderRadius: '12px', background: 'white', padding: '1rem' }} />
        </div>
        <p className="text-muted" style={{ marginBottom: '2rem' }}>Sign in to manage academy</p>

        {error && <div style={{ background: 'var(--status-due-bg)', color: 'var(--status-due)', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="input-group" style={{ textAlign: 'left' }}>
            <label>Username</label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                placeholder="Enter username" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                style={{ paddingLeft: '2.5rem' }} 
                required 
              />
            </div>
          </div>
          
          <div className="input-group" style={{ textAlign: 'left' }}>
            <label>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="password" 
                placeholder="Enter password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                style={{ paddingLeft: '2.5rem' }} 
                required 
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem', padding: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }} disabled={isLoading}>
            {isLoading ? <Loader2 size={18} className="spin" /> : 'Login to Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
