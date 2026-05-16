// src/pages/UserDashboard.jsx
const UserDashboard = () => {
  // Bunlar ilerde backend'den gelecek veriler
  const stats = {
    activeLoans: 2,
    totalRead: 15,
    fine: "0.00 TL",
    name: "Mükremin"
  };

  return (
    <div style={{ padding: '30px', fontFamily: 'sans-serif' }}>
      <h1>Hoş geldin, {stats.name}! 👋</h1>
      <p>Kütüphane hesabının genel durumu aşağıdadır.</p>

      {/* İstatistik Kartları */}
      <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
        <div style={cardStyle}>
          <h3>{stats.activeLoans}</h3>
          <p>Şu an Ödünç Aldıkların</p>
        </div>
        <div style={cardStyle}>
          <h3>{stats.totalRead}</h3>
          <p>Bugüne Kadar Okunan</p>
        </div>
        <div style={{...cardStyle, borderLeft: '5px solid red'}}>
          <h3>{stats.fine}</h3>
          <p>Gecikme Cezası</p>
        </div>
      </div>

      <div style={{ marginTop: '40px' }}>
        <h3>Hızlı İşlemler</h3>
        <button style={btnStyle}>Kitap Ara</button>
        <button style={{...btnStyle, marginLeft: '10px'}}>Profilimi Güncelle</button>
      </div>
    </div>
  );
};

// Basit stiller
const cardStyle = {
  flex: 1,
  padding: '20px',
  borderRadius: '8px',
  boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
  backgroundColor: '#fff',
  border: '1px solid #eee'
};

const btnStyle = {
  padding: '10px 20px',
  cursor: 'pointer',
  backgroundColor: '#333',
  color: 'white',
  border: 'none',
  borderRadius: '4px'
};

export default UserDashboard;