import { useNavigate } from 'react-router-dom';

const EditProfile = () => {
  const navigate = useNavigate();

  const handleCancel = () => {
    navigate('/profile'); // İptal edince geri atar
  };

  return (
    <div style={{ padding: '50px', display: 'flex', justifyContent: 'center' }}>
      <div className="card" style={{ width: '100%', maxWidth: '500px', padding: '40px' }}>
        <h2>Bilgileri Güncelle</h2>
        <p style={{ color: '#666', fontSize: '0.9rem' }}>Değişiklikleri yaptıktan sonra kaydet butonuna basın.</p>
        
        <input type="text" placeholder="Ad Soyad" style={inputStyle} />
        <input type="text" placeholder="Telefon" style={inputStyle} />
        <textarea placeholder="Adres" style={inputStyle} rows="4"></textarea>

        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button style={saveBtn}>Kaydet</button>
          <button onClick={handleCancel} style={cancelBtn}>İptal</button>
        </div>
      </div>
    </div>
  );
};

const inputStyle = { width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' };
const saveBtn = { flex: 2, padding: '12px', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' };
const cancelBtn = { flex: 1, padding: '12px', backgroundColor: '#bdc3c7', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' };

export default EditProfile;