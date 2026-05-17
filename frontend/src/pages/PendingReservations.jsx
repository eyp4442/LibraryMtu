import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

const PendingReservations = () => {
  const navigate = useNavigate();

  const [reservations, setReservations] = useState([]);
  const [dueDays, setDueDays] = useState({});
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    loadPendingReservations();
  }, []);

  const loadPendingReservations = async () => {
    const token = localStorage.getItem("accessToken");
    const role = localStorage.getItem("role");

    if (!token) {
      navigate("/login");
      return;
    }

    if (role !== "Admin" && role !== "Librarian") {
      navigate("/");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      const response = await api.get("/api/Reservations/pending");
      const items = response.data.items || [];

      setReservations(items);

      const initialDueDays = {};
      items.forEach((item) => {
        initialDueDays[item.id] = 15;
      });

      setDueDays(initialDueDays);
    } catch (error) {
      const message =
        error.response?.data?.error?.message ||
        "Bekleyen rezervasyonlar yüklenirken bir hata oluştu.";

      setErrorMessage(message);

      if (error.response?.status === 401 || error.response?.status === 403) {
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const calculateDueDate = (days) => {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + Number(days));
    return dueDate.toISOString();
  };

  const handleCheckout = async (reservationId) => {
    const days = dueDays[reservationId] || 15;

    const confirmed = window.confirm(
      `Bu rezervasyonu ${days} gün süreyle ödünç kaydına çevirmek istiyor musunuz?`
    );

    if (!confirmed) return;

    try {
      setActionLoadingId(reservationId);
      setErrorMessage("");
      setSuccessMessage("");

      await api.post(`/api/Reservations/${reservationId}/checkout`, {
        dueDate: calculateDueDate(days),
      });

      setSuccessMessage("Rezervasyon başarıyla ödünç kaydına çevrildi.");
      await loadPendingReservations();
    } catch (error) {
      const message =
        error.response?.data?.error?.message ||
        "Rezervasyon ödünç kaydına çevrilirken bir hata oluştu.";

      setErrorMessage(message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCancel = async (reservationId) => {
    const confirmed = window.confirm("Bu rezervasyonu iptal etmek istiyor musunuz?");

    if (!confirmed) return;

    try {
      setActionLoadingId(reservationId);
      setErrorMessage("");
      setSuccessMessage("");

      await api.delete(`/api/Reservations/${reservationId}`);

      setSuccessMessage("Rezervasyon başarıyla iptal edildi.");
      await loadPendingReservations();
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

  return (
    <div style={containerStyle}>
      <h2 style={{ color: "#2c3e50" }}>Ayırtılan Kitaplar</h2>

      <p style={descriptionStyle}>
        Kullanıcıların ayırttığı kitapları buradan görebilir ve kullanıcı kitabı
        almaya geldiğinde rezervasyonu ödünç kaydına çevirebilirsiniz.
      </p>

      {loading && <div style={messageStyle}>Rezervasyonlar yükleniyor...</div>}

      {errorMessage && <div style={errorStyle}>{errorMessage}</div>}

      {successMessage && <div style={successStyle}>{successMessage}</div>}

      {!loading && reservations.length === 0 && !errorMessage && (
        <div className="card" style={emptyStyle}>
          Bekleyen aktif rezervasyon bulunmuyor.
        </div>
      )}

      {!loading && reservations.length > 0 && (
        <div className="card" style={tableCardStyle}>
          <table style={tableStyle}>
            <thead>
              <tr style={tableHeaderStyle}>
                <th style={thStyle}>ID</th>
                <th style={thStyle}>Üye</th>
                <th style={thStyle}>Kitap</th>
                <th style={thStyle}>Kopya Barkodu</th>
                <th style={thStyle}>Ayırtma Tarihi</th>
                <th style={thStyle}>Geçerlilik Sonu</th>
                <th style={thStyle}>Ödünç Süresi</th>
                <th style={thStyle}>İşlem</th>
              </tr>
            </thead>

            <tbody>
              {reservations.map((reservation) => {
                const isActionLoading = actionLoadingId === reservation.id;

                return (
                  <tr key={reservation.id} style={{ textAlign: "center" }}>
                    <td style={tdStyle}>{reservation.id}</td>
                    <td style={tdStyle}>
                      {reservation.memberFullName || `Üye ID: ${reservation.memberId}`}
                    </td>
                    <td style={tdStyle}>
                      {reservation.bookTitle || `Kitap ID: ${reservation.bookId}`}
                    </td>
                    <td style={tdStyle}>
                      {reservation.copyBarcode || reservation.copyId || "-"}
                    </td>
                    <td style={tdStyle}>{formatDate(reservation.reservedAt)}</td>
                    <td style={tdStyle}>{formatDate(reservation.expiresAt)}</td>
                    <td style={tdStyle}>
                      <select
                        value={dueDays[reservation.id] || 15}
                        onChange={(event) =>
                          setDueDays((previous) => ({
                            ...previous,
                            [reservation.id]: Number(event.target.value),
                          }))
                        }
                        style={selectStyle}
                      >
                        <option value={7}>7 gün</option>
                        <option value={15}>15 gün</option>
                        <option value={30}>30 gün</option>
                      </select>
                    </td>
                    <td style={tdStyle}>
                      <button
                        onClick={() => handleCheckout(reservation.id)}
                        disabled={isActionLoading}
                        style={checkoutBtnStyle}
                      >
                        Ödünç Ver
                      </button>

                      <button
                        onClick={() => handleCancel(reservation.id)}
                        disabled={isActionLoading}
                        style={cancelBtnStyle}
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

const selectStyle = {
  padding: "7px",
  borderRadius: "6px",
  border: "1px solid #ddd",
};

const checkoutBtnStyle = {
  backgroundColor: "#27ae60",
  color: "white",
  border: "none",
  padding: "7px 12px",
  cursor: "pointer",
  borderRadius: "4px",
  fontWeight: "bold",
};

const cancelBtnStyle = {
  backgroundColor: "#e74c3c",
  color: "white",
  border: "none",
  padding: "7px 12px",
  cursor: "pointer",
  borderRadius: "4px",
  marginLeft: "6px",
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

export default PendingReservations;