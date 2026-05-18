import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";

const Navbar = () => {
  const navigate = useNavigate();

  const accessToken = localStorage.getItem("accessToken");
  const role = localStorage.getItem("role");

  const isLoggedIn = !!accessToken;

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem("refreshToken");

    try {
      if (refreshToken) {
        await api.post("/api/Auth/logout", {
          refreshToken,
        });
      }
    } catch (error) {
      console.error("Logout endpoint çağrılırken hata oluştu:", error);
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("refreshTokenExpiresAt");
      localStorage.removeItem("role");

      navigate("/login");
    }
  };

  return (
    <nav style={navStyle}>
      <div style={logoStyle} onClick={() => navigate("/")}>
        📚 Kütüphane
      </div>

      <div style={menuStyle}>
        <Link to="/books" style={linkStyle}>
          Kitaplar
        </Link>

        {!isLoggedIn && (
          <>
            <Link to="/login" style={linkStyle}>
              Giriş Yap
            </Link>

            <Link to="/register" style={regStyle}>
              Üye Ol
            </Link>
          </>
        )}

        {isLoggedIn && role === "User" && (
          <>
            <Link to="/dashboard" style={linkStyle}>
              Panelim
            </Link>

            <Link to="/my-loans" style={linkStyle}>
              Emanetlerim
            </Link>

            <Link to="/my-reservations" style={linkStyle}>
              Rezervasyonlarım
            </Link>

            <Link to="/profile" style={linkStyle}>
              Profil
            </Link>

            <Link to="/edit-profile" style={linkStyle}>
              Profilimi Güncelle
            </Link>
          </>
        )}

        {isLoggedIn && role === "Librarian" && (
          <>
            <Link to="/lib-dashboard" style={linkStyle}>
              Yönetim
            </Link>

            <Link to="/pending-reservations" style={linkStyle}>
              Ayırtılan Kitaplar
            </Link>

            <Link to="/give-loan" style={linkStyle}>
              Kitap Ver
            </Link>

            <Link to="/active-loans" style={linkStyle}>
              Emanetteki Kitaplar
            </Link>

            <Link to="/pending-returns" style={linkStyle}>
              İade Onayları
            </Link>

            <Link to="/overdue-loans" style={linkStyle}>
              Gecikmişler
            </Link>

            <Link to="/approve-members" style={linkStyle}>
              Üye Onayları
            </Link>

            <Link to="/approve-emails" style={linkStyle}>
              E-posta Onayları
            </Link>

            <Link to="/add-book" style={linkStyle}>
              + Kitap
            </Link>

            <Link to="/categories" style={linkStyle}>
              Kategoriler
            </Link>

            <Link to="/authors" style={linkStyle}>
              Yazarlar
            </Link>
          </>
        )}

        {isLoggedIn && role === "Admin" && (
          <>
            <Link to="/admin-panel" style={linkStyle}>
              Sistem
            </Link>

            <Link to="/lib-dashboard" style={linkStyle}>
              Yönetim
            </Link>

            <Link to="/pending-reservations" style={linkStyle}>
              Ayırtılan Kitaplar
            </Link>

            <Link to="/give-loan" style={linkStyle}>
              Kitap Ver
            </Link>

            <Link to="/active-loans" style={linkStyle}>
              Emanetteki Kitaplar
            </Link>

            <Link to="/pending-returns" style={linkStyle}>
              İade Onayları
            </Link>

            <Link to="/overdue-loans" style={linkStyle}>
              Gecikmişler
            </Link>

            <Link to="/approve-members" style={linkStyle}>
              Üye Onayları
            </Link>

            <Link to="/approve-emails" style={linkStyle}>
              E-posta Onayları
            </Link>

            <Link to="/add-book" style={linkStyle}>
              + Kitap
            </Link>

            <Link to="/categories" style={linkStyle}>
              Kategoriler
            </Link>

            <Link to="/authors" style={linkStyle}>
              Yazarlar
            </Link>
          </>
        )}

        {isLoggedIn && (
          <button onClick={handleLogout} style={logoutBtnStyle}>
            Çıkış
          </button>
        )}
      </div>
    </nav>
  );
};

const navStyle = {
  display: "flex",
  justifyContent: "space-between",
  padding: "0 20px",
  minHeight: "60px",
  backgroundColor: "#2c3e50",
  color: "white",
  alignItems: "center",
  fontFamily: "sans-serif",
};

const logoStyle = {
  fontWeight: "bold",
  fontSize: "1.2rem",
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const menuStyle = {
  display: "flex",
  gap: "15px",
  alignItems: "center",
  flexWrap: "wrap",
  justifyContent: "flex-end",
};

const linkStyle = {
  color: "white",
  textDecoration: "none",
  fontSize: "0.9rem",
  whiteSpace: "nowrap",
};

const regStyle = {
  ...linkStyle,
  backgroundColor: "#27ae60",
  padding: "5px 10px",
  borderRadius: "4px",
};

const logoutBtnStyle = {
  backgroundColor: "#e74c3c",
  color: "white",
  border: "none",
  padding: "5px 10px",
  borderRadius: "4px",
  cursor: "pointer",
  whiteSpace: "nowrap",
};

export default Navbar;