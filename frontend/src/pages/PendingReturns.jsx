// src/pages/PendingReturns.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

const PendingReturns = () => {
  const navigate = useNavigate();

  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    loadPendingReturns();
  }, []);

  const loadPendingReturns = async () => {
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

      const response = await api.get("/api/Loans/pending-return");
      setLoans(response.data.items || []);
    } catch (error) {
      const message =
        error.response?.data?.error?.message ||
        "İade onayı bekleyen kayıtlar yüklenirken bir hata oluştu.";

      setErrorMessage(message);

      if (error.response?.status === 401 || error.response?.status === 403) {
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApproveReturn = async (loanId) => {
    const confirmed = window.confirm(
      "Bu iade talebini onaylamak istiyor musunuz?"
    );

    if (!confirmed) return;

    try {
      setActionLoadingId(loanId);
      setErrorMessage("");
      setSuccessMessage("");

      await api.post(`/api/Loans/${loanId}/approve-return`);

      setSuccessMessage("İade talebi başarıyla onaylandı.");
      setLoans((previous) => previous.filter((loan) => loan.id !== loanId));
    } catch (error) {
      const message =
        error.response?.data?.error?.message ||
        "İade talebi onaylanırken bir hata oluştu.";

      setErrorMessage(message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectReturn = async (loanId) => {
    const reason = window.prompt("İade reddetme sebebi:", "");

    if (reason === null) return;

    try {
      setActionLoadingId(loanId);
      setErrorMessage("");
      setSuccessMessage("");

      await api.post(`/api/Loans/${loanId}/reject-return`, {
        reason: reason.trim(),
      });

      setSuccessMessage("İade talebi reddedildi.");
      setLoans((previous) => previous.filter((loan) => loan.id !== loanId));
    } catch (error) {
      const message =
        error.response?.data?.error?.message ||
        "İade talebi reddedilirken bir hata oluştu.";

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
      <h2 style={{ color: "#2c3e50" }}>İade Onayı Bekleyen Emanetler</h2>

      <p style={descriptionStyle}>
        Kullanıcıların oluşturduğu iade taleplerini buradan onaylayabilir veya
        reddedebilirsiniz.
      </p>

      {loading && <div style={messageStyle}>İade talepleri yükleniyor...</div>}

      {errorMessage && <div style={errorStyle}>{errorMessage}</div>}

      {successMessage && <div style={successStyle}>{successMessage}</div>}

      {!loading && loans.length === 0 && !errorMessage && (
        <div className="card" style={emptyStyle}>
          İade onayı bekleyen kayıt bulunmuyor.
        </div>
      )}

      {!loading && loans.length > 0 && (
        <div className="card" style={tableCardStyle}>
          <table style={tableStyle}>
            <thead>
              <tr style={tableHeaderStyle}>
                <th style={thStyle}>Loan ID</th>
                <th style={thStyle}>Üye ID</th>
                <th style={thStyle}>Kopya ID</th>
                <th style={thStyle}>Alış Tarihi</th>
                <th style={thStyle}>Son İade Tarihi</th>
                <th style={thStyle}>İade Talep Tarihi</th>
                <th style={thStyle}>Durum</th>
                <th style={thStyle}>İşlem</th>
              </tr>
            </thead>

            <tbody>
              {loans.map((loan) => {
                const isActionLoading = actionLoadingId === loan.id;

                return (
                  <tr key={loan.id} style={{ textAlign: "center" }}>
                    <td style={tdStyle}>{loan.id}</td>
                    <td style={tdStyle}>{loan.memberId}</td>
                    <td style={tdStyle}>{loan.copyId}</td>
                    <td style={tdStyle}>{formatDate(loan.loanDate)}</td>
                    <td style={tdStyle}>{formatDate(loan.dueDate)}</td>
                    <td style={tdStyle}>{formatDate(loan.returnRequestedAt)}</td>
                    <td style={tdStyle}>
                      <span style={statusBadgeStyle}>
                        {loan.status}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <button
                        onClick={() => handleApproveReturn(loan.id)}
                        disabled={isActionLoading}
                        style={approveBtnStyle}
                      >
                        Onayla
                      </button>

                      <button
                        onClick={() => handleRejectReturn(loan.id)}
                        disabled={isActionLoading}
                        style={rejectBtnStyle}
                      >
                        Reddet
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p style={noteStyle}>
        Not: Backend loan DTO'sunda şu an kitap adı gelmediği için tabloda kopya
        ID gösteriliyor. Kitap adını göstermek istersek backend tarafında
        LoanItemDto genişletilebilir.
      </p>
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

const statusBadgeStyle = {
  display: "inline-block",
  padding: "5px 10px",
  borderRadius: "20px",
  backgroundColor: "#3498db",
  color: "white",
  fontSize: "0.8rem",
  fontWeight: "bold",
};

const approveBtnStyle = {
  backgroundColor: "#27ae60",
  color: "white",
  border: "none",
  padding: "7px 12px",
  cursor: "pointer",
  borderRadius: "4px",
  fontWeight: "bold",
};

const rejectBtnStyle = {
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

const noteStyle = {
  marginTop: "20px",
  color: "#7f8c8d",
  fontSize: "0.85rem",
  lineHeight: "1.5",
};

export default PendingReturns;