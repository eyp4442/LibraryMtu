import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

const Profile = () => {
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");

      const response = await api.get("/api/Me/profile");
      setProfile(response.data);
    } catch (error) {
      const message =
        error.response?.data?.error?.message ||
        "Profil bilgileri yüklenirken bir hata oluştu.";

      setErrorMessage(message);

      if (error.response?.status === 401 || error.response?.status === 403) {
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (fullName) => {
    if (!fullName) return "?";

    return fullName
      .trim()
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join("");
  };

  if (loading) {
    return (
      <div style={containerStyle}>
        <div className="card" style={profileCard}>
          <p style={messageStyle}>Profil bilgileri yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div style={containerStyle}>
        <div className="card" style={profileCard}>
          <p style={errorStyle}>{errorMessage}</p>

          <button onClick={() => navigate("/login")} style={editBtnStyle}>
            Giriş Sayfasına Dön
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div style={containerStyle}>
      <div className="card" style={profileCard}>
        <div style={headerStyle}>
          <div style={avatarStyle}>{getInitials(profile.fullName)}</div>
          <h2>Profil Bilgilerim</h2>
          <p style={usernameStyle}>@{profile.username}</p>
        </div>

        <div style={infoGrid}>
          <div style={infoBox}>
            <strong>Ad Soyad:</strong> {profile.fullName}
          </div>

          <div style={infoBox}>
            <strong>Kullanıcı Adı:</strong> {profile.username}
          </div>

          <div style={infoBox}>
            <strong>E-posta:</strong> {profile.email}
          </div>

          <div style={infoBox}>
            <strong>Telefon:</strong> {profile.phone}
          </div>

          <div style={infoBox}>
            <strong>Adres:</strong> {profile.address}
          </div>
        </div>

        <button onClick={() => navigate("/edit-profile")} style={editBtnStyle}>
          Bilgileri Düzenle
        </button>
      </div>
    </div>
  );
};

// --- TASARIM (STİLLER) ---
const containerStyle = {
  padding: "50px",
  display: "flex",
  justifyContent: "center",
};

const profileCard = {
  width: "100%",
  maxWidth: "600px",
  padding: "40px",
  textAlign: "center",
};

const headerStyle = {
  marginBottom: "30px",
};

const avatarStyle = {
  width: "80px",
  height: "80px",
  backgroundColor: "#3498db",
  borderRadius: "50%",
  color: "white",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "2rem",
  margin: "0 auto 15px",
  fontWeight: "bold",
};

const usernameStyle = {
  color: "#7f8c8d",
  marginTop: "-10px",
  fontSize: "0.95rem",
};

const infoGrid = {
  display: "flex",
  flexDirection: "column",
  gap: "15px",
  marginBottom: "30px",
  textAlign: "left",
};

const infoBox = {
  padding: "15px",
  backgroundColor: "#f8f9fa",
  borderRadius: "8px",
  border: "1px solid #eee",
};

const editBtnStyle = {
  width: "100%",
  padding: "15px",
  backgroundColor: "#2c3e50",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "bold",
  fontSize: "1rem",
};

const messageStyle = {
  color: "#7f8c8d",
};

const errorStyle = {
  backgroundColor: "#fdecea",
  color: "#c0392b",
  padding: "12px",
  borderRadius: "8px",
  marginBottom: "20px",
};

export default Profile;