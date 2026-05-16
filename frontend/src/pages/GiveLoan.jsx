// src/pages/GiveLoan.jsx
import { useState } from 'react';

const GiveLoan = () => {
  const [loan, setLoan] = useState({ userEmail: '', barcode: '', days: 15 });

  const handleLoan = (e) => {
    e.preventDefault();
    alert(`${loan.barcode} barkodlu kitap, ${loan.userEmail} kullanıcısına ${loan.days} günlüğüne verilmiştir.`);
  };

  return (
    <div style={{ padding: '30px', maxWidth: '400px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h2>Emanet Kitap Ver 📖</h2>
      <form onSubmit={handleLoan} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <label>
          Üye E-posta:
          <input type="email" placeholder="ornek@mail.com" required style={inputStyle} onChange={(e) => setLoan({...loan, userEmail: e.target.value})} />
        </label>
        <label>
          Kitap Barkod:
          <input type="text" placeholder="BRK-001" required style={inputStyle} onChange={(e) => setLoan({...loan, barcode: e.target.value})} />
        </label>
        <label>
          Süre (Gün):
          <input type="number" value={loan.days} style={inputStyle} onChange={(e) => setLoan({...loan, days: e.target.value})} />
        </label>
        <button type="submit" style={{ padding: '12px', backgroundColor: '#8e44ad', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
          İşlemi Tamamla
        </button>
      </form>
    </div>
  );
};

const inputStyle = { width: '100%', padding: '10px', marginTop: '5px', boxSizing: 'border-box' };

export default GiveLoan;