import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

const ActiveLoans = () => {
  const navigate = useNavigate();

  const [loans, setLoans] = useState([]);
  const [filteredLoans, setFilteredLoans] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    loadActiveLoans();
  }, []);

  useEffect(() => {
    applyFilter();
  }, [searchTerm, loans]);

  const loadActiveLoans = async () => {
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

      const response = await api.get("/api/Loans/active");
      const items = response.data.items || [];

      setLoans(items);
      setFilteredLoans(items);
    } catch (error) {
      const message =
        error.response?.data?.error?.message ||
        "Aktif ödünç kayıtları yüklenirken bir hata oluştu.";

      setErrorMessage(message);

      if (error.response?.status === 401 || error.response?.status === 403) {
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = () => {
    const value = searchTerm.trim().toLowerCase();

    if (!value) {
      setFilteredLoans(loans);
      return;
    }

    const filtered = loans.filter((loan) => {
      return (
        String(loan.id).includes(value) ||
        String(loan.memberId).includes(value) ||
        String(loan.copyId).includes(value) ||
        loan.memberFullName?.toLowerCase().includes(value) ||
        loan.memberEmail?.toLowerCase().includes(value) ||
        loan.memberPhone?.toLowerCase().includes(value) ||
        loan.bookTitle?.toLowerCase().includes(value) ||
        loan.bookAuthor?.toLowerCase().includes(value) ||
        loan.barcode?.toLowerCase().includes(value)
      );
    });

    setFilteredLoans(filtered);
  };

  const handleDirectReturn = async (loanId) => {
    const confirmed = window.confirm(
      "Bu ödünç kaydını doğrudan iade edilmiş olarak işaretlemek istiyor musunuz?"
    );

    if (!confirmed) return;

    try {
      setActionLoadingId(loanId);
      setErrorMessage("");
      setSuccessMessage("");

      await api.post("/api/Loans/return", {
        loanId,
      });

      setSuccessMessage("Kitap başarıyla iade alındı.");
      await loadActiveLoans();
    } catch (error) {
      const message =
        error.response?.data?.error?.message ||
        "İade işlemi sırasında bir hata oluştu.";

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

  const getStatusText = (loan) => {
    if (loan.status === "Overdue") return "Gecikmiş";
    if (loan.status === "Active") return "Aktif";
    if (loan.status === "ReturnPendingApproval") return "İade Onayı Bekliyor";

    return loan.status || "-";
  };

  return (
    <div style={containerStyle}>
      <h2 style={{ color: "#2c3e50" }}>Emanetteki Kitaplar</h2>

      <p style={descriptionStyle}>
        Şu anda kullanıcıların üzerinde bulunan kitapları, üye bilgilerini ve
        iade tarihlerini buradan takip edebilirsiniz.
      </p>

      <div className="card" style={filterBoxStyle}>
        <input
          type="text"
          placeholder="Üye adı, e-posta, kitap adı, barkod veya loan ID ile ara..."
          style={searchInputStyle}
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />

        <button onClick={loadActiveLoans} style={refreshBtnStyle}>
          Yenile
        </button>
      </div>

      {loading && <div style={messageStyle}>Aktif ödünç kayıtları yükleniyor...</div>}

      {errorMessage && <div style={errorStyle}>{errorMessage}</div>}

      {successMessage && <div style={successStyle}>{successMessage}</div>}

      {!loading && filteredLoans.length === 0 && !errorMessage && (
        <div className="card" style={emptyStyle}>
          Emanette kitap kaydı bulunmuyor.
        </div>
      )}

      {!loading && filteredLoans.length > 0 && (
        <div className="card" style={tableCardStyle}>
          <table style={tableStyle}>
            <thead>
              <tr style={tableHeaderStyle}>
                <th style={thStyle}>Loan ID</th>
                <th style={thStyle}>Üye</th>
                <th style={thStyle}>İletişim</th>
                <th style={thStyle}>Kitap</th>
                <th style={thStyle}>Barkod</th>
                <th style={thStyle}>Alış Tarihi</th>
                <th style={thStyle}>Son İade</th>
                <th style={thStyle}>Durum</th>
                <th style={thStyle}>İşlem</th>
              </tr>
            </thead>

            <tbody>
              {filteredLoans.map((loan) => {
                const isActionLoading = actionLoadingId === loan.id;

                return (
                  <tr key={loan.id} style={{ textAlign: "center" }}>
                    <td style={tdStyle}>{loan.id}</td>

                    <td style={tdStyle}>
                      <strong>{loan.memberFullName}</strong>
                      <br />
                      <span style={subTextStyle}>ID: {loan.memberId}</span>
                    </td>

                    <td style={tdStyle}>
                      {loan.memberEmail}
                      <br />
                      <span style={subTextStyle}>{loan.memberPhone || "-"}</span>
                    </td>

                    <td style={tdStyle}>
                      <strong>{loan.bookTitle}</strong>
                      <br />
                      <span style={subTextStyle}>{loan.bookAuthor}</span>
                    </td>

                    <td style={tdStyle}>{loan.barcode}</td>

                    <td style={tdStyle}>{formatDate(loan.loanDate)}</td>

                    <td style={tdStyle}>
                      {formatDate(loan.dueDate)}
                      {loan.isOverdue && (
                        <>
                          <br />
                          <span style={overdueTextStyle}>
                            {loan.overdueDays} gün gecikmiş
                          </span>
                        </>
                      )}
                    </td>

                    <td style={tdStyle}>
                      <span style={statusBadgeStyle(loan.status)}>
                        {getStatusText(loan)}
                      </span>
                    </td>

                    <td style={tdStyle}>
                      <button
                        onClick={() => navigate(`/book/${loan.bookId}`)}
                        style={detailBtnStyle}
                      >
                        Kitap Detayı
                      </button>

                      <button
                        onClick={() => handleDirectReturn(loan.id)}
                        style={returnBtnStyle}
                        disabled={isActionLoading}
                      >
                        {isActionLoading ? "İşleniyor..." : "İade Al"}
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

const filterBoxStyle = {
  display: "flex",
  gap: "10px",
  padding: "15px",
  marginBottom: "20px",
};

const searchInputStyle = {
  flex: 1,
  padding: "12px",
  borderRadius: "8px",
  border: "1px solid #ddd",
  outline: "none",
};

const refreshBtnStyle = {
  padding: "12px 16px",
  backgroundColor: "#3498db",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "bold",
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
  verticalAlign: "top",
};

const subTextStyle = {
  fontSize: "0.8rem",
  color: "#7f8c8d",
};

const overdueTextStyle = {
  color: "#e74c3c",
  fontSize: "0.8rem",
  fontWeight: "bold",
};

const statusBadgeStyle = (status) => ({
  display: "inline-block",
  padding: "5px 10px",
  borderRadius: "20px",
  color: "white",
  fontSize: "0.8rem",
  fontWeight: "bold",
  backgroundColor:
    status === "Overdue"
      ? "#e74c3c"
      : status === "ReturnPendingApproval"
      ? "#9b59b6"
      : "#27ae60",
});

const detailBtnStyle = {
  display: "block",
  width: "100%",
  marginBottom: "6px",
  padding: "7px 10px",
  backgroundColor: "#2c3e50",
  color: "white",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
  fontWeight: "bold",
};

const returnBtnStyle = {
  display: "block",
  width: "100%",
  padding: "7px 10px",
  backgroundColor: "#27ae60",
  color: "white",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
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

export default ActiveLoans;