import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

const OverdueLoans = () => {
  const navigate = useNavigate();

  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadOverdueLoans();
  }, []);

  const loadOverdueLoans = async () => {
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

      const response = await api.get("/api/Loans/overdue");
      setLoans(response.data.items || []);
    } catch (error) {
      const message =
        error.response?.data?.error?.message ||
        "Gecikmiş ödünç kayıtları yüklenirken bir hata oluştu.";

      setErrorMessage(message);
    } finally {
      setLoading(false);
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

  const calculateOverdueDays = (dueDate) => {
    if (!dueDate) return 0;

    const due = new Date(dueDate);
    const now = new Date();

    const diffMs = now - due;
    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  };

  return (
    <div style={containerStyle}>
      <h2 style={{ color: "#2c3e50" }}>Gecikmiş Ödünç Kayıtları</h2>

      <p style={descriptionStyle}>
        Son iade tarihi geçmiş ve henüz iade edilmemiş ödünç kayıtları burada
        listelenir.
      </p>

      {loading && <div style={messageStyle}>Gecikmiş kayıtlar yükleniyor...</div>}

      {errorMessage && <div style={errorStyle}>{errorMessage}</div>}

      {!loading && loans.length === 0 && !errorMessage && (
        <div className="card" style={emptyStyle}>
          Gecikmiş ödünç kaydı bulunmuyor.
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
                <th style={thStyle}>Gecikme</th>
                <th style={thStyle}>Durum</th>
              </tr>
            </thead>

            <tbody>
              {loans.map((loan) => (
                <tr key={loan.id} style={{ textAlign: "center" }}>
                  <td style={tdStyle}>{loan.id}</td>
                  <td style={tdStyle}>{loan.memberId}</td>
                  <td style={tdStyle}>{loan.copyId}</td>
                  <td style={tdStyle}>{formatDate(loan.loanDate)}</td>
                  <td style={tdStyle}>{formatDate(loan.dueDate)}</td>
                  <td style={tdStyle}>{calculateOverdueDays(loan.dueDate)} gün</td>
                  <td style={tdStyle}>
                    <span style={statusBadgeStyle}>Gecikmiş</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p style={noteStyle}>
        Not: Backend loan DTO'sunda kitap adı ve üye adı gelmediği için burada
        üye ID ve kopya ID gösteriliyor. İleride DTO genişletilirse bu ekran daha
        okunabilir hale getirilebilir.
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
  backgroundColor: "#e74c3c",
  color: "white",
  fontSize: "0.8rem",
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

const noteStyle = {
  marginTop: "20px",
  color: "#7f8c8d",
  fontSize: "0.85rem",
  lineHeight: "1.5",
};

export default OverdueLoans;