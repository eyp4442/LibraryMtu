// src/pages/LibrarianDashboard.jsx
import { useNavigate } from 'react-router-dom';

const LibrarianDashboard = () => {
  const navigate = useNavigate();

  const stats = {
    pendingMembers: 5,
    overdueBooks: 12,
    totalBooks: 1500
  };

  return (
    <div style={{ padding: '30px', fontFamily: 'sans-serif' }}>
      <h1>Kazım'ın Yönetim Paneli 🛠️</h1>
      <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
        <div style={cardStyle}>
          <h3>{stats.pendingMembers}</h3>
          <p>Onay Bekleyen Üye</p>
          <button onClick={() => navigate('/approve-members')} style={miniBtnStyle}>Görüntüle</button>
        </div>
        <div style={cardStyle}>
          <h3>{stats.overdueBooks}</h3>
          <p>Gecikmiş Kitap</p>
          <button style={miniBtnStyle}>Listele</button>
        </div>
        <div style={cardStyle}>
          <h3>{stats.totalBooks}</h3>
          <p>Toplam Kitap Sayısı</p>
          <button onClick={() => navigate('/add-book')} style={miniBtnStyle}>Kitap Ekle</button>
        </div>
      </div>
    </div>
  );
};

const cardStyle = { flex: 1, padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #ddd' };
const miniBtnStyle = { marginTop: '10px', padding: '5px 10px', cursor: 'pointer', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' };

export default LibrarianDashboard;