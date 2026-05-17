// src/pages/LibrarianDashboard.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

const LibrarianDashboard = () => {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    pendingMembers: 0,
    pendingEmailChanges: 0,
    pendingReturns: 0,
    overdueBooks: 0,
    totalBooks: 0,
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    const token = localStorage.getItem("accessToken");
    const role = localStorage.getItem("role");

    if (!token) {
      navigate("/login");
      return;
    }

    if (role !== "Librarian" && role !== "Admin") {
      navigate("/");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");

      const [
        pendingMembersResponse,
        pendingEmailsResponse,
        pendingReturnsResponse,
        overdueLoansResponse,
        booksResponse,
      ] = await Promise.all([
        api.get("/api/registration-requests/pending"),
        api.get("/api/email-change-requests/pending"),
        api.get("/api/Loans/pending-return"),
        api.get("/api/Loans/overdue"),
        api.get("/api/Books", {
          params: {
            page: 1,
            pageSize: 1,
          },
        }),
      ]);

      setStats({
        pendingMembers: pendingMembersResponse.data.items?.length || 0,
        pendingEmailChanges: pendingEmailsResponse.data.items?.length || 0,
        pendingReturns: pendingReturnsResponse.data.items?.length || 0,
        overdueBooks: overdueLoansResponse.data.items?.length || 0,
        totalBooks: booksResponse.data.total || 0,
      });
    } catch (error) {
      const message =
        error.response?.data?.error?.message ||
        "Yönetim paneli bilgileri yüklenirken bir hata oluştu.";

      setErrorMessage(message);

      if (error.response?.status === 401 || error.response?.status === 403) {
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={containerStyle}>
        <div className="card" style={messageCardStyle}>
          Yönetim paneli yükleniyor...
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <h1>Yönetim Paneli 🛠️</h1>

      <p style={descriptionStyle}>
        Kütüphane operasyonlarının genel durumu aşağıdadır.
      </p>

      {errorMessage && <div style={errorStyle}>{errorMessage}</div>}

      <div style={gridStyle}>
        <div style={cardStyle}>
          <h3>{stats.pendingMembers}</h3>
          <p>Onay Bekleyen Üye</p>

          <button
            onClick={() => navigate("/approve-members")}
            style={miniBtnStyle}
          >
            Görüntüle
          </button>
        </div>

        <div style={cardStyle}>
          <h3>{stats.pendingEmailChanges}</h3>
          <p>Onay Bekleyen E-posta Değişikliği</p>

          <button
            onClick={() => navigate("/approve-emails")}
            style={miniBtnStyle}
          >
            Görüntüle
          </button>
        </div>

        <div style={cardStyle}>
          <h3>{stats.pendingReturns}</h3>
          <p>İade Onayı Bekleyen Emanet</p>

          <button
            onClick={() => navigate("/pending-returns")}
            style={miniBtnStyle}
          >
            Görüntüle
          </button>
        </div>

        <div style={cardStyle}>
          <h3>{stats.overdueBooks}</h3>
          <p>Gecikmiş Ödünç Kaydı</p>

          <button onClick={() => navigate("/give-loan")} style={miniBtnStyle}>
            Ödünç İşlemleri
          </button>
        </div>

        <div style={cardStyle}>
          <h3>{stats.totalBooks}</h3>
          <p>Toplam Kitap Sayısı</p>

          <button onClick={() => navigate("/add-book")} style={miniBtnStyle}>
            Kitap Ekle
          </button>
        </div>
      </div>

      <div className="card" style={quickActionsStyle}>
        <h3>Hızlı İşlemler</h3>

        <div style={buttonGroupStyle}>
          <button onClick={() => navigate("/add-book")} style={actionBtnStyle}>
            Kitap Ekle
          </button>

          <button onClick={() => navigate("/categories")} style={actionBtnStyle}>
            Kategorileri Yönet
          </button>

          <button onClick={() => navigate("/give-loan")} style={actionBtnStyle}>
            Kitap Ödünç Ver
          </button>

          <button
            onClick={() => navigate("/pending-reservations")}
            style={actionBtnStyle}
          >
            Ayırtılan Kitaplar
          </button>

          <button
            onClick={() => navigate("/pending-returns")}
            style={actionBtnStyle}
          >
            İade Onayları
          </button>

          <button
            onClick={() => navigate("/approve-members")}
            style={actionBtnStyle}
          >
            Üye Başvuruları
          </button>

          <button
            onClick={() => navigate("/approve-emails")}
            style={actionBtnStyle}
          >
            E-posta Onayları
          </button>
        </div>
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
  marginBottom: "20px",
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "20px",
  marginTop: "20px",
};

const cardStyle = {
  padding: "20px",
  backgroundColor: "#f8f9fa",
  borderRadius: "8px",
  border: "1px solid #ddd",
  boxShadow: "0 4px 8px rgba(0,0,0,0.05)",
};

const miniBtnStyle = {
  marginTop: "10px",
  padding: "8px 12px",
  cursor: "pointer",
  backgroundColor: "#007bff",
  color: "white",
  border: "none",
  borderRadius: "4px",
  fontWeight: "bold",
};

const quickActionsStyle = {
  marginTop: "30px",
  padding: "20px",
};

const buttonGroupStyle = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
};

const actionBtnStyle = {
  padding: "10px 15px",
  backgroundColor: "#2c3e50",
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: "bold",
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

export default LibrarianDashboard;