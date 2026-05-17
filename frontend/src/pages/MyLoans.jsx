import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

const MyLoans = () => {
  const navigate = useNavigate();

  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    loadLoans();
  }, []);

  const loadLoans = async () => {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      const response = await api.get("/api/Me/loans");
      setLoans(response.data.items || []);
    } catch (error) {
      const message =
        error.response?.data?.error?.message ||
        "Ödünç kayıtları yüklenirken bir hata oluştu.";

      setErrorMessage(message);

      if (error.response?.status === 401 || error.response?.status === 403) {
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRenew = async (loanId) => {
    try {
      setActionLoadingId(loanId);
      setErrorMessage("");
      setSuccessMessage("");

      await api.post(`/api/Me/loans/${loanId}/renew`);

      setSuccessMessage("Ödünç süresi başarıyla uzatıldı.");
      await loadLoans();
    } catch (error) {
      const message =
        error.response?.data?.error?.message ||
        "Ödünç süresi uzatılırken bir hata oluştu.";

      setErrorMessage(message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRequestReturn = async (loanId) => {
    try {
      setActionLoadingId(loanId);
      setErrorMessage("");
      setSuccessMessage("");

      await api.post(`/api/Me/loans/${loanId}/request-return`, {
        note: "",
      });

      setSuccessMessage("İade talebiniz başarıyla oluşturuldu.");
      await loadLoans();
    } catch (error) {
      const message =
        error.response?.data?.error?.message ||
        "İade talebi oluşturulurken bir hata oluştu.";

      setErrorMessage(message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const formatDate = (value) => {
    if (!value) return "-";

    return new Date(value).toLocaleDateString("tr-TR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const getStatusText = (status) => {
    switch (status) {
      case "Active":
        return "Elinizde";
      case "Returned":
        return "Teslim Edildi";
      case "Overdue":
        return "Gecikmiş";
      case "ReturnPendingApproval":
        return "İade Onayı Bekliyor";
      default:
        return status || "-";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Active":
        return "#27ae60";
      case "Returned":
        return "#7f8c8d";
      case "Overdue":
        return "#e74c3c";
      case "ReturnPendingApproval":
        return "#3498db";
      default:
        return "#34495e";
    }
  };

  return (
    <div style={containerStyle}>
      <h2 style={{ color: "#2c3e50" }}>Ödünç Aldığım Kitaplar</h2>

      <p style={descriptionStyle}>
        Burada aktif, iade edilmiş veya iade onayı bekleyen ödünç kayıtlarınızı
        görüntüleyebilirsiniz.
      </p>

      {loading && <div style={messageStyle}>Ödünç kayıtları yükleniyor...</div>}

      {errorMessage && <div style={errorStyle}>{errorMessage}</div>}

      {successMessage && <div style={successStyle}>{successMessage}</div>}

      {!loading && loans.length === 0 && !errorMessage && (
        <div className="card" style={emptyStyle}>
          Henüz ödünç aldığınız kitap bulunmuyor.
        </div>
      )}

      {!loading && loans.length > 0 && (
        <div className="card" style={tableCardStyle}>
          <table style={tableStyle}>
            <thead>
              <tr style={tableHeaderStyle}>
                <th style={thStyle}>Loan ID</th>
                <th style={thStyle}>Kopya ID</th>
                <th style={thStyle}>Alış Tarihi</th>
                <th style={thStyle}>Son İade Tarihi</th>
                <th style={thStyle}>İade Tarihi</th>
                <th style={thStyle}>Durum</th>
                <th style={thStyle}>Uzatma</th>
                <th style={thStyle}>İşlem</th>
              </tr>
            </thead>

            <tbody>
              {loans.map((loan) => {
                const canRenew = loan.status === "Active";
                const canRequestReturn = loan.status === "Active";
                const isCurrentActionLoading = actionLoadingId === loan.id;

                return (
                  <tr key={loan.id} style={{ textAlign: "center" }}>
                    <td style={tdStyle}>{loan.id}</td>
                    <td style={tdStyle}>{loan.copyId}</td>
                    <td style={tdStyle}>{formatDate(loan.loanDate)}</td>
                    <td style={tdStyle}>{formatDate(loan.dueDate)}</td>
                    <td style={tdStyle}>{formatDate(loan.returnDate)}</td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          ...statusBadgeStyle,
                          backgroundColor: getStatusColor(loan.status),
                        }}
                      >
                        {getStatusText(loan.status)}
                      </span>
                    </td>
                    <td style={tdStyle}>{loan.renewCount} / 2</td>
                    <td style={tdStyle}>
                      <div style={actionGroupStyle}>
                        <button
                          onClick={() => handleRenew(loan.id)}
                          disabled={!canRenew || isCurrentActionLoading}
                          style={{
                            ...smallBtnStyle,
                            backgroundColor: canRenew ? "#3498db" : "#bdc3c7",
                          }}
                        >
                          Uzat
                        </button>

                        <button
                          onClick={() => handleRequestReturn(loan.id)}
                          disabled={!canRequestReturn || isCurrentActionLoading}
                          style={{
                            ...smallBtnStyle,
                            backgroundColor: canRequestReturn ? "#27ae60" : "#bdc3c7",
                          }}
                        >
                          İade Talebi
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p style={noteStyle}>
        Not: Mevcut backend yanıtında kitap adı değil, kopya ID bilgisi geliyor.
        Kitap adını burada göstermek istersek backend tarafındaki loan DTO'suna
        kitap başlığı eklememiz gerekir.
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
  marginTop: "10px",
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
  color: "white",
  padding: "5px 10px",
  borderRadius: "20px",
  fontSize: "0.8rem",
  fontWeight: "bold",
  display: "inline-block",
};

const actionGroupStyle = {
  display: "flex",
  gap: "8px",
  justifyContent: "center",
  flexWrap: "wrap",
};

const smallBtnStyle = {
  color: "white",
  border: "none",
  borderRadius: "6px",
  padding: "7px 10px",
  cursor: "pointer",
  fontSize: "0.8rem",
  fontWeight: "bold",
};

const messageStyle = {
  padding: "15px",
  color: "#7f8c8d",
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

const emptyStyle = {
  padding: "25px",
  color: "#7f8c8d",
  textAlign: "center",
};

const noteStyle = {
  marginTop: "20px",
  color: "#7f8c8d",
  fontSize: "0.85rem",
  lineHeight: "1.5",
};

export default MyLoans;