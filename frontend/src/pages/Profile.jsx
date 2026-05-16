import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const navigate = useNavigate(); // Yönlendirme için gerekli kanca

  // Bu veriler normalde backend'den gelecek, şimdilik statik tutuyoruz
  const user = {
    name: 'Mükremin Akdaş',
    email: 'mikda@mail.com',
    phone: '0555 555 55 55',
    address: 'Osmaniye / Türkiye'
  };

  return (
    <div style={containerStyle}>
      <div className="card" style={profileCard}>
        <div style={headerStyle}>
          <div style={avatarStyle}>MA</div>
          <h2>Profil Bilgilerim</h2>
        </div>

        <div style={infoGrid}>
          <div style={infoBox}><strong>Ad Soyad:</strong> {user.name}</div>
          <div style={infoBox}><strong>E-posta:</strong> {user.email}</div>
          <div style={infoBox}><strong>Telefon:</strong> {user.phone}</div>
          <div style={infoBox}><strong>Adres:</strong> {user.address}</div>
        </div>

        {/* İŞTE O KRİTİK BUTON */}
        <button 
          onClick={() => navigate('/edit-profile')} 
          style={editBtnStyle}
        >
          Bilgileri Düzenle
        </button>
      </div>
    </div>
  );
};

// --- TASARIM (STİLLER) ---
const containerStyle = { padding: '50px', display: 'flex', justifyContent: 'center' };
const profileCard = { width: '100%', maxWidth: '600px', padding: '40px', textAlign: 'center' };
const headerStyle = { marginBottom: '30px' };
const avatarStyle = { 
  width: '80px', height: '80px', backgroundColor: '#3498db', borderRadius: '50%', 
  color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', 
  fontSize: '2rem', margin: '0 auto 15px', fontWeight: 'bold' 
};
const infoGrid = { display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '30px', textAlign: 'left' };
const infoBox = { padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #eee' };
const editBtnStyle = { 
  width: '100%', padding: '15px', backgroundColor: '#2c3e50', color: 'white', 
  border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' 
};

export default Profile;