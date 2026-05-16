import { useNavigate } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();

  const handleLogin = () => {
    // Burada ileride gerçek auth işlemi yapılacak
    alert("Giriş Başarılı! Panelinize yönlendiriliyorsunuz.");
    navigate('/dashboard');
  };

  return (
    <div style={containerStyle}>
      <div className="card" style={loginCardStyle}>
        <div style={iconCircleStyle}>🔐</div>
        <h2 style={{ color: '#2c3e50', margin: '10px 0' }}>Tekrar Hoş Geldiniz</h2>
        <p style={{ color: '#7f8c8d', marginBottom: '30px', fontSize: '0.9rem' }}>
          Lütfen kütüphane hesabınızla giriş yapın.
        </p>

        <div style={{ textAlign: 'left', width: '100%' }}>
          <label style={labelStyle}>E-posta Adresi</label>
          <input type="email" placeholder="ornek@mail.com" style={inputStyle} />
          
          <label style={labelStyle}>Şifre</label>
          <input type="password" placeholder="••••••••" style={inputStyle} />
        </div>

        <button onClick={handleLogin} style={loginBtnStyle}>
          Giriş Yap
        </button>

        <div style={{ marginTop: '25px', fontSize: '0.85rem', color: '#7f8c8d' }}>
          Henüz hesabınız yok mu? 
          <span 
            onClick={() => navigate('/register')} 
            style={{ color: '#3498db', cursor: 'pointer', fontWeight: 'bold', marginLeft: '5px' }}
          >
            Üyelik Başvurusu Yap
          </span>
        </div>
      </div>
    </div>
  );
};

// --- STİLLER ---
const containerStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '80vh',
  padding: '20px'
};

const loginCardStyle = {
  width: '100%',
  maxWidth: '420px',
  textAlign: 'center',
  padding: '40px'
};

const iconCircleStyle = {
  width: '60px',
  height: '60px',
  backgroundColor: '#f8f9fa',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '1.5rem',
  margin: '0 auto 20px auto'
};

const labelStyle = {
  display: 'block',
  fontSize: '0.85rem',
  fontWeight: '600',
  color: '#34495e',
  marginBottom: '5px',
  marginLeft: '2px'
};

const inputStyle = {
  width: '100%',
  padding: '12px 15px',
  marginBottom: '20px',
  borderRadius: '8px',
  border: '1px solid #dee2e6',
  boxSizing: 'border-box',
  outline: 'none',
  fontSize: '1rem'
};

const loginBtnStyle = {
  width: '100%',
  padding: '14px',
  backgroundColor: '#2c3e50',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  fontSize: '1rem',
  fontWeight: 'bold',
  boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
};

export default Login;