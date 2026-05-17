// src/pages/GiveLoan.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

const GiveLoan = () => {
  const navigate = useNavigate();

  const [members, setMembers] = useState([]);
  const [books, setBooks] = useState([]);
  const [copies, setCopies] = useState([]);

  const [loan, setLoan] = useState({
    memberId: "",
    bookId: "",
    copyId: "",
    days: 15,
  });

  const [loading, setLoading] = useState(false);
  const [copiesLoading, setCopiesLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (loan.bookId) {
      loadCopiesByBookId(loan.bookId);
    } else {
      setCopies([]);
      setLoan((previous) => ({
        ...previous,
        copyId: "",
      }));
    }
  }, [loan.bookId]);

  const loadInitialData = async () => {
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

      const [membersResponse, booksResponse] = await Promise.all([
        api.get("/api/Members"),
        api.get("/api/Books", {
          params: {
            page: 1,
            pageSize: 200,
            sortBy: "title",
            sortDirection: "asc",
          },
        }),
      ]);

      setMembers(membersResponse.data.items || []);
      setBooks(booksResponse.data.items || []);
    } catch (error) {
      const message =
        error.response?.data?.error?.message ||
        "Üye ve kitap bilgileri yüklenirken bir hata oluştu.";

      setErrorMessage(message);

      if (error.response?.status === 401 || error.response?.status === 403) {
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const loadCopiesByBookId = async (bookId) => {
    try {
      setCopiesLoading(true);
      setErrorMessage("");

      const response = await api.get(`/api/books/${bookId}/copies`);
      const availableCopies = (response.data.items || []).filter(
        (copy) => copy.status === "Available"
      );

      setCopies(availableCopies);

      setLoan((previous) => ({
        ...previous,
        copyId: "",
      }));
    } catch (error) {
      const message =
        error.response?.data?.error?.message ||
        "Kitap kopyaları yüklenirken bir hata oluştu.";

      setErrorMessage(message);
      setCopies([]);
    } finally {
      setCopiesLoading(false);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setLoan((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const calculateDueDate = (days) => {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + Number(days));
    return dueDate.toISOString();
  };

  const handleLoan = async (event) => {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    if (!loan.memberId) {
      setErrorMessage("Üye seçilmelidir.");
      return;
    }

    if (!loan.bookId) {
      setErrorMessage("Kitap seçilmelidir.");
      return;
    }

    if (!loan.copyId) {
      setErrorMessage("Müsait kitap kopyası seçilmelidir.");
      return;
    }

    if (!loan.days || Number(loan.days) <= 0) {
      setErrorMessage("Süre 0'dan büyük olmalıdır.");
      return;
    }

    try {
      setSubmitting(true);

      await api.post("/api/Loans/checkout", {
        memberId: Number(loan.memberId),
        copyId: Number(loan.copyId),
        dueDate: calculateDueDate(loan.days),
      });

      setSuccessMessage("Kitap ödünç verme işlemi başarıyla tamamlandı.");

      setLoan({
        memberId: "",
        bookId: "",
        copyId: "",
        days: 15,
      });

      setCopies([]);
    } catch (error) {
      const message =
        error.response?.data?.error?.message ||
        "Kitap ödünç verilirken bir hata oluştu.";

      setErrorMessage(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={containerStyle}>
        <div className="card" style={cardStyle}>
          Bilgiler yükleniyor...
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div className="card" style={cardStyle}>
        <h2 style={{ color: "#2c3e50", marginTop: 0 }}>Emanet Kitap Ver 📖</h2>

        <p style={descriptionStyle}>
          Üye, kitap ve müsait fiziksel kopya seçerek ödünç verme işlemi
          oluşturabilirsiniz.
        </p>

        {errorMessage && <div style={errorStyle}>{errorMessage}</div>}

        {successMessage && <div style={successStyle}>{successMessage}</div>}

        <form onSubmit={handleLoan} style={formStyle}>
          <label style={labelStyle}>
            Üye
            <select
              name="memberId"
              required
              style={inputStyle}
              value={loan.memberId}
              onChange={handleChange}
            >
              <option value="">Üye seçin</option>

              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.fullName} - {member.email}
                </option>
              ))}
            </select>
          </label>

          <label style={labelStyle}>
            Kitap
            <select
              name="bookId"
              required
              style={inputStyle}
              value={loan.bookId}
              onChange={handleChange}
            >
              <option value="">Kitap seçin</option>

              {books.map((book) => (
                <option key={book.id} value={book.id}>
                  {book.title} - {book.author}
                </option>
              ))}
            </select>
          </label>

          <label style={labelStyle}>
            Müsait Kitap Kopyası
            <select
              name="copyId"
              required
              style={inputStyle}
              value={loan.copyId}
              onChange={handleChange}
              disabled={!loan.bookId || copiesLoading}
            >
              <option value="">
                {copiesLoading
                  ? "Kopyalar yükleniyor..."
                  : "Müsait kopya seçin"}
              </option>

              {copies.map((copy) => (
                <option key={copy.id} value={copy.id}>
                  {copy.barcode} - {copy.status}
                </option>
              ))}
            </select>
          </label>

          {loan.bookId && !copiesLoading && copies.length === 0 && (
            <div style={warningStyle}>
              Bu kitap için müsait kopya bulunmuyor.
            </div>
          )}

          <label style={labelStyle}>
            Süre / Gün
            <input
              type="number"
              name="days"
              min="1"
              required
              value={loan.days}
              style={inputStyle}
              onChange={handleChange}
            />
          </label>

          <button type="submit" style={submitBtnStyle} disabled={submitting}>
            {submitting ? "İşlem yapılıyor..." : "İşlemi Tamamla"}
          </button>
        </form>

        <p style={noteStyle}>
          Not: Backend ödünç verme endpoint'i üye e-postası ve barkod yerine
          doğrudan <strong>memberId</strong> ve <strong>copyId</strong> bekliyor.
          Bu yüzden formda seçim listesi kullanıldı.
        </p>
      </div>
    </div>
  );
};

const containerStyle = {
  padding: "30px",
  maxWidth: "520px",
  margin: "0 auto",
  fontFamily: "sans-serif",
};

const cardStyle = {
  padding: "30px",
};

const descriptionStyle = {
  color: "#7f8c8d",
  fontSize: "0.9rem",
  marginBottom: "20px",
};

const formStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "15px",
};

const labelStyle = {
  display: "flex",
  flexDirection: "column",
  fontWeight: "bold",
  color: "#34495e",
  gap: "6px",
};

const inputStyle = {
  width: "100%",
  padding: "10px",
  boxSizing: "border-box",
  borderRadius: "8px",
  border: "1px solid #ddd",
  fontSize: "1rem",
};

const submitBtnStyle = {
  padding: "12px",
  backgroundColor: "#8e44ad",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "bold",
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

const warningStyle = {
  backgroundColor: "#fff8e1",
  color: "#8a6d3b",
  padding: "10px",
  borderRadius: "8px",
  fontSize: "0.9rem",
};

const noteStyle = {
  color: "#7f8c8d",
  fontSize: "0.85rem",
  lineHeight: "1.5",
  marginTop: "20px",
};

export default GiveLoan;