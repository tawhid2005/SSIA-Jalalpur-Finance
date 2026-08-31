import React from 'react';

const PrintHeader = ({ title }) => {
  return (
    <div style={{ textAlign: 'center', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '2px solid #ccc' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '2rem' }}>
        <img src="/logo.png" alt="Logo" style={{ width: '100%', maxWidth: '200px', height: 'auto', objectFit: 'contain' }} />
        <div style={{ textAlign: 'left' }}>
          <h1 style={{ fontSize: '1.8rem', color: '#111', margin: '0' }}>Shah Sultan IELTS Academy</h1>
          <h2 style={{ fontSize: '1.2rem', color: '#444', margin: '0' }}>Jalalpur Branch</h2>
        </div>
      </div>
      <p style={{ fontSize: '0.9rem', color: '#333', margin: '0.5rem 0', fontWeight: '500' }}>
        SSIA Jalalpur is a reliable English language institute offering IELTS, Spoken English, Kid's, Basic Computer & more.
      </p>
      <p style={{ fontSize: '0.85rem', color: '#555', margin: '0' }}>
        2nd Floor Mosahid Plaza, Jalalpur Bazar, Collage Road, Sylhet, Bangladesh, 3100<br/>
        Phone: +880 1337-993522
      </p>
      {title && <h3 style={{ marginTop: '1.5rem', background: '#eee', display: 'inline-block', padding: '0.5rem 2rem', borderRadius: '4px' }}>{title}</h3>}
    </div>
  );
};

export default PrintHeader;
