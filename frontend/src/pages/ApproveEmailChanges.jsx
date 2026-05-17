import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

const ApproveEmailChanges = () => {
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const fetchPendingRequests = async () => {
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

      const response = await api.get("/api/email-change-requests/pending");
      setRequests(response.data.items || []);
    } catch (error) {
      const message =
        error.response?.data?.error?.message ||
        "E-posta değişiklik talepleri yüklenirken bir hata oluştu.";

      setErrorMessage(message);

      if (error.response?.status === 401 || error.response?.status === 403) {
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    const confirmed = window.confirm(
      "Bu e-posta değişiklik talebini onaylamak istiyor musunuz?"
    );

    if (!confirmed) return;

    try {
      setActionLoadingId(id);
      setErrorMessage("");
      setSuccessMessage("");

      await api.post(`/api/email-change-requests/${id}/approve`);

      setSuccessMessage("E-posta değişiklik talebi başarıyla onaylandı.");
      setRequests((previous) => previous.filter((request) => request.id !== id));
    } catch (error) {
      const message =
        error.response?.data?.error?.message ||
        "E-posta değişiklik talebi onaylanırken bir hata oluştu.";

      setErrorMessage(message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt("Reddetme sebebinizi giriniz:", "");

    if (reason === null) return;

    try {
      setActionLoadingId(id);
      setErrorMessage("");
      setSuccessMessage("");

      await api.post(`/api/email-change-requests/${id}/reject`, {
        reason: reason.trim(),
      });

      setSuccessMessage("E-posta değişiklik talebi reddedildi.");
      setRequests((previous) => previous.filter((request) => request.id !== id));
    } catch (error) {
      const message =
        error.response?.data?.error?.message ||
        "E-posta değişiklik talebi reddedilirken bir hata oluştu.";

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

  if (loading) {
    return (
      <div style={containerStyle}>
        <div className="card" style={messageCardStyle}>
          E-posta değişiklik talepleri yükleniyor...
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <h2 style={{ marginBottom: "10px", color: "#2c3e50" }}>
        📧 E-posta Değişiklik Talepleri
      </h2>

      <p style={descriptionStyle}>
        Kullanıcıların oluşturduğu e-posta değişiklik taleplerini buradan
        onaylayabilir veya reddedebilirsiniz.
      </p>

      {errorMessage && <div style={errorStyle}>{errorMessage}</div>}

      {successMessage && <div style={successStyle}>{successMessage}</div>}

      {requests.length === 0 && !errorMessage ? (
        <div className="card" style={emptyStyle}>
          Bekleyen e-posta değişiklik talebi bulunmamaktadır.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          {requests.map((request) => {
            const isActionLoading = actionLoadingId === request.id;

            return (
              <div key={request.id} className="card" style={requestCardStyle}>
                <div style={{ textAlign: "left" }}>
                  <div style={titleStyle}>
                    Talep ID: {request.id} / Üye ID: {request.memberId}
                  </div>

                  <div style={infoStyle}>
                    <strong>Kullanıcı ID:</strong> {request.userId}
                  </div>

                  <div style={infoStyle}>
                    <strong>Mevcut E-posta:</strong>{" "}
                    <span style={{ color: "#7f8c8d" }}>
                      {request.currentEmail}
                    </span>
                  </div>

                  <div style={infoStyle}>
                    <strong>Yeni E-posta:</strong>{" "}
                    <span style={{ color: "#27ae60", fontWeight: "bold" }}>
                      {request.newEmail}
                    </span>
                  </div>

                  <div style={dateStyle}>
                    Tarih: {formatDate(request.createdAt)}
                  </div>
                </div>

                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    onClick={() => handleApprove(request.id)}
                    style={approveBtn}
                    disabled={isActionLoading}
                  >
                    Onayla
                  </button>

                  <button
                    onClick={() => handleReject(request.id)}
                    style={rejectBtn}
                    disabled={isActionLoading}
                  >
                    Reddet
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const containerStyle = {
  padding: "40px",
  maxWidth: "1000px",
  margin: "0 auto",
};

const descriptionStyle = {
  color: "#7f8c8d",
  marginBottom: "20px",
};

const requestCardStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "20px",
  gap: "20px",
};

const titleStyle = {
  fontWeight: "bold",
  fontSize: "1.1rem",
  marginBottom: "8px",
  color: "#2c3e50",
};

const infoStyle = {
  marginBottom: "5px",
  color: "#34495e",
};

const dateStyle = {
  fontSize: "0.8rem",
  marginTop: "8px",
  color: "#7f8c8d",
};

const approveBtn = {
  padding: "10px 20px",
  backgroundColor: "#27ae60",
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: "bold",
};

const rejectBtn = {
  padding: "10px 20px",
  backgroundColor: "#e74c3c",
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

export default ApproveEmailChanges;