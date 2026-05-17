// src/pages/UserDashboard.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

const UserDashboard = () => {
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");

      const [profileResponse, loansResponse] = await Promise.all([
        api.get("/api/Me/profile"),
        api.get("/api/Me/loans"),
      ]);

      setProfile(profileResponse.data);
      setLoans(loansResponse.data.items || []);
    } catch (error) {
      const message =
        error.response?.data?.error?.message ||
        "Panel bilgileri yüklenirken bir hata oluştu.";

      setErrorMessage(message);

      if (error.response?.status === 401 || error.response?.status === 403) {
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const activeLoans = loans.filter(
      (loan) =>
        loan.status === "Active" ||
        loan.status === "ReturnPendingApproval"
    ).length;

    const returnedLoans = loans.filter(
      (loan) => loan.status === "Returned"
    ).length;

    const overdueLoans = loans.filter(
      (loan) => loan.status === "Overdue"
    ).length;

    return {
      activeLoans,
      returnedLoans,
      overdueLoans,
    };
  }, [loans]);

  const firstName = profile?.fullName?.trim()?.split(" ")?.[0] || "Kullanıcı";

  if (loading) {
    return (
      <div style={containerStyle}>
        <div className="card" style={messageCardStyle}>
          Panel bilgileri yükleniyor...
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div style={containerStyle}>
        <div style={errorStyle}>{errorMessage}</div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <h1>Hoş geldin, {firstName}! 👋</h1>

      <p style={descriptionStyle}>
        Kütüphane hesabının genel durumu aşağıdadır.
      </p>

      <div style={statsGridStyle}>
        <div style={cardStyle}>
          <h3>{stats.activeLoans}</h3>
          <p>Aktif Emanet Sayısı</p>
        </div>

        <div style={cardStyle}>
          <h3>{stats.returnedLoans}</h3>
          <p>İade Edilmiş Emanet Sayısı</p>
        </div>

        <div style={{ ...cardStyle, borderLeft: "5px solid #e74c3c" }}>
          <h3>{stats.overdueLoans}</h3>
          <p>Gecikmiş Emanet Sayısı</p>
        </div>
      </div>

      <div className="card" style={profileSummaryStyle}>
        <h3>Profil Özeti</h3>

        <p>
          <strong>Kullanıcı Adı:</strong> {profile?.username || "-"}
        </p>

        <p>
          <strong>E-posta:</strong> {profile?.email || "-"}
        </p>

        <p>
          <strong>Telefon:</strong> {profile?.phone || "-"}
        </p>

        <p>
          <strong>Adres:</strong> {profile?.address || "-"}
        </p>
      </div>

      <div style={{ marginTop: "40px" }}>
        <h3>Hızlı İşlemler</h3>

        <button onClick={() => navigate("/books")} style={btnStyle}>
          Kitap Ara
        </button>

        <button
          onClick={() => navigate("/edit-profile")}
          style={{ ...btnStyle, marginLeft: "10px" }}
        >
          Profilimi Güncelle
        </button>

        <button
          onClick={() => navigate("/my-loans")}
          style={{ ...btnStyle, marginLeft: "10px" }}
        >
          Emanetlerim
        </button>
      </div>
    </div>
  );
};

const containerStyle = {
  padding: "30px",
  fontFamily: "sans-serif",
};

const descriptionStyle = {
  color: "#7f8c8d",
};

const statsGridStyle = {
  display: "flex",
  gap: "20px",
  marginTop: "20px",
  flexWrap: "wrap",
};

const cardStyle = {
  flex: 1,
  minWidth: "220px",
  padding: "20px",
  borderRadius: "8px",
  boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
  backgroundColor: "#fff",
  border: "1px solid #eee",
};

const profileSummaryStyle = {
  marginTop: "30px",
  padding: "20px",
};

const btnStyle = {
  padding: "10px 20px",
  cursor: "pointer",
  backgroundColor: "#333",
  color: "white",
  border: "none",
  borderRadius: "4px",
};

const messageCardStyle = {
  padding: "25px",
  color: "#7f8c8d",
};

const errorStyle = {
  backgroundColor: "#fdecea",
  color: "#c0392b",
  padding: "12px",
  borderRadius: "8px",
  marginBottom: "15px",
};

export default UserDashboard;