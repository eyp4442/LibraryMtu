import { Link, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();
  const role = 'user'; 

  return (
    <nav style={navStyle}>
      <div style={logoStyle} onClick={() => navigate('/')}>📚 Kütüphane</div>
      
      <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
        <Link to="/books" style={linkStyle}>Kitaplar</Link>
        
        {role === 'guest' && (
          <><Link to="/login" style={linkStyle}>Giriş</Link><Link to="/register" style={regStyle}>Kayıt</Link></>
        )}

        {role === 'user' && (
          <>
            <Link to="/dashboard" style={linkStyle}>Panelim</Link>
            <Link to="/my-loans" style={linkStyle}>Emanetlerim</Link>
            <Link to="/profile" style={linkStyle}>Profil</Link>
            <Link to="/edit-profile" style={linkStyle}>Profilimi Güncelle</Link>
          </>
        )}

        {role === 'librarian' && (
          <>
            <Link to="/lib-dashboard" style={linkStyle}>Yönetim</Link>
            <Link to="/give-loan" style={linkStyle}>Kitap Ver</Link>
            <Link to="/approve-members" style={linkStyle}>Onaylar</Link>
            <Link to="/approve-emails" style={linkStyle}>E-posta Onayları</Link>
            <Link to="/add-book" style={linkStyle}>+Kitap</Link>
            <Link to="/categories" style={linkStyle}>Kategoriler</Link>
            <Link to="/authors" style={linkStyle}>Yazarlar</Link>
          </>
        )}

        {role === 'admin' && (
          <>
            <Link to="/admin-panel" style={linkStyle}>Sistem</Link>
            <Link to="/libraries" style={linkStyle}>Kütüphaneler</Link>
            <Link to="/approve-emails" style={linkStyle}>E-posta Onayları</Link>
          </>
        )}

        {role !== 'guest' && <button onClick={() => navigate('/login')} style={logoutBtnStyle}>Çıkış</button>}
      </div>
    </nav>
  );
};

const navStyle = { display: 'flex', justifyContent: 'space-between', padding: '0 20px', height: '60px', backgroundColor: '#2c3e50', color: 'white', alignItems: 'center', fontFamily: 'sans-serif' };
const logoStyle = { fontWeight: 'bold', fontSize: '1.2rem', cursor: 'pointer' };
const linkStyle = { color: 'white', textDecoration: 'none', fontSize: '0.9rem' };
const regStyle = { ...linkStyle, backgroundColor: '#27ae60', padding: '5px 10px', borderRadius: '4px' };
const logoutBtnStyle = { backgroundColor: '#e74c3c', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' };

export default Navbar;