import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

const MyReservations = () => {
  const navigate = useNavigate();

  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    loadReservations();
  }, []);

  const loadReservations = async () => {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      const profileResponse = await api.get("/api/Me/profile");
      const memberId = profileResponse.data.memberId;

      const response = await api.get(`/api/members/${memberId}/reservations`);
      setReservations(response.data.items || []);
    } catch (error) {
      const message =
        error.response?.data?.error?.message ||
        "Rezervasyonlar yüklenirken bir hata oluştu.";

      setErrorMessage(message);

      if (error.response?.status === 401 || error.response?.status === 403) {
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelReservation = async (reservationId) => {
    const confirmed = window.confirm("Bu rezervasyonu iptal etmek istiyor musunuz?");

    if (!confirmed) return;

    try {
      setActionLoadingId(reservationId);
      setErrorMessage("");
      setSuccessMessage("");

      await api.delete(`/api/Reservations/${reservationId}`);

      setSuccessMessage("Rezervasyon başarıyla iptal edildi.");
      await loadReservations();
    } catch (error) {
      const message =
        error.response?.data?.error?.message ||
        "Rezervasyon iptal edilirken bir hata oluştu.";

      setErrorMessage(message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const formatDate = (value) => {
    if (!value) return "-";

    return new Date(value).toLocaleString("tr-TR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusText = (status) => {
    switch (status) {
      case "Active":
        return "Aktif";
      case "Cancelled":
        return "İptal Edildi";
      case "Fulfilled":
        return "Ödünce Çevrildi";
      case "Expired":
        return "Süresi Doldu";
      default:
        return status || "-";
    }
  };

  return (
    <div style={containerStyle}>
      <h2 style={{ color: "#2c3e50" }}>Rezervasyonlarım</h2>

      <p style={descriptionStyle}>
        Ayırttığınız kitapları ve geçerlilik sürelerini buradan görüntüleyebilirsiniz.
      </p>

      {loading && <div style={messageStyle}>Rezervasyonlar yükleniyor...</div>}

      {errorMessage && <div style={errorStyle}>{errorMessage}</div>}

      {successMessage && <div style={successStyle}>{successMessage}</div>}

      {!loading && reservations.length === 0 && !errorMessage && (
        <div className="card" style={emptyStyle}>
          Henüz rezervasyon kaydınız bulunmuyor.
        </div>
      )}

      {!loading && reservations.length > 0 && (
        <div className="card" style={tableCardStyle}>
          <table style={tableStyle}>
            <thead>
              <tr style={tableHeaderStyle}>
                <th style={thStyle}>ID</th>
                <th style={thStyle}>Kitap</th>
                <th style={thStyle}>Kopya Barkodu</th>
                <th style={thStyle}>Ayırtma Tarihi</th>
                <th style={thStyle}>Geçerlilik Sonu</th>
                <th style={thStyle}>Durum</th>
                <th style={thStyle}>İşlem</th>
              </tr>
            </thead>

            <tbody>
              {reservations.map((reservation) => {
                const isActive = reservation.status === "Active";
                const isActionLoading = actionLoadingId === reservation.id;

                return (
                  <tr key={reservation.id} style={{ textAlign: "center" }}>
                    <td style={tdStyle}>{reservation.id}</td>
                    <td style={tdStyle}>
                      {reservation.bookTitle || `Kitap ID: ${reservation.bookId}`}
                    </td>
                    <td style={tdStyle}>
                      {reservation.copyBarcode || reservation.copyId || "-"}
                    </td>
                    <td style={tdStyle}>{formatDate(reservation.reservedAt)}</td>
                    <td style={tdStyle}>{formatDate(reservation.expiresAt)}</td>
                    <td style={tdStyle}>
                      <span style={statusBadgeStyle(reservation.status)}>
                        {getStatusText(reservation.status)}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <button
                        onClick={() => handleCancelReservation(reservation.id)}
                        disabled={!isActive || isActionLoading}
                        style={{
                          ...deleteBtnStyle,
                          backgroundColor: isActive ? "#e74c3c" : "#bdc3c7",
                        }}
                      >
                        İptal Et
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
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

const tableCardStyle = {
  padding: "20px",
  overflowX: "auto",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
};

const tableHeaderStyle = {
  backgroundColor: "#f4f4f4",
};

const thStyle = {
  padding: "12px",
  borderBottom: "1px solid #ddd",
  color: "#2c3e50",
};

const tdStyle = {
  padding: "12px",
  borderBottom: "1px solid #eee",
};

const statusBadgeStyle = (status) => ({
  display: "inline-block",
  padding: "5px 10px",
  borderRadius: "20px",
  color: "white",
  fontSize: "0.8rem",
  fontWeight: "bold",
  backgroundColor:
    status === "Active"
      ? "#27ae60"
      : status === "Cancelled"
      ? "#e74c3c"
      : status === "Fulfilled"
      ? "#3498db"
      : "#7f8c8d",
});

const deleteBtnStyle = {
  color: "white",
  border: "none",
  padding: "7px 12px",
  cursor: "pointer",
  borderRadius: "4px",
  fontWeight: "bold",
};

const messageStyle = {
  padding: "15px",
  color: "#7f8c8d",
};

const emptyStyle = {
  padding: "25px",
  color: "#7f8c8d",
  textAlign: "center",
};

const errorStyle = {
  backgroundColor: "#fdecea",
  color: "#c0392b",
  padding: "12px",
  borderRadius: "8px",
  marginBottom: "15px",
};

const successStyle = {
  backgroundColor: "#eafaf1",
  color: "#229954",
  padding: "12px",
  borderRadius: "8px",
  marginBottom: "15px",
};

export default MyReservations;