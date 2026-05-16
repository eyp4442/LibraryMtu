// src/pages/AdminPanel.jsx
import { useNavigate } from 'react-router-dom';

const AdminPanel = () => {
  const navigate = useNavigate();

  return (
    <div style={{ padding: '30px', fontFamily: 'sans-serif' }}>
      <h1>Sistem Admin Paneli 👑</h1>
      <p>Tüm kütüphaneleri ve personelleri buradan yönetebilirsiniz.</p>
      
      <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
        <div style={adminCardStyle}>
          <h3>Kütüphane Yönetimi</h3>
          <p>Yeni kütüphane şubeleri ekle veya düzenle.</p>
          <button onClick={() => navigate('/libraries')} style={adminBtnStyle}>Kütüphaneleri Yönet</button>
        </div>
        
        <div style={adminCardStyle}>
          <h3>Personel Yönetimi</h3>
          <p>Kazım ve diğer görevlileri sisteme tanımla.</p>
          <button style={adminBtnStyle}>Görevlileri Yönet</button>
        </div>
      </div>
    </div>
  );
};

const adminCardStyle = { flex: 1, padding: '20px', backgroundColor: '#2c3e50', color: 'white', borderRadius: '10px' };
const adminBtnStyle = { marginTop: '10px', padding: '8px 15px', cursor: 'pointer', backgroundColor: '#f1c40f', border: 'none', borderRadius: '4px', fontWeight: 'bold' };

export default AdminPanel;