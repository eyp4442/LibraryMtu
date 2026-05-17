import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/axios";

const BookDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [book, setBook] = useState(null);
  const [copies, setCopies] = useState([]);
  const [newBarcode, setNewBarcode] = useState("");

  const [holdMinutes, setHoldMinutes] = useState(1440);

  const [loading, setLoading] = useState(false);
  const [copiesLoading, setCopiesLoading] = useState(false);
  const [copyAddLoading, setCopyAddLoading] = useState(false);
  const [reservationLoading, setReservationLoading] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const [copyError, setCopyError] = useState("");
  const [reservationMessage, setReservationMessage] = useState("");
  const [reservationError, setReservationError] = useState("");

  const accessToken = localStorage.getItem("accessToken");
  const role = localStorage.getItem("role");

  const isUser = role === "User";
  const isStaff = role === "Admin" || role === "Librarian";

  useEffect(() => {
    loadBookDetail();
  }, [id]);

  useEffect(() => {
    if (book && isStaff) {
      loadBookCopies();
    }
  }, [book, isStaff]);

  const loadBookDetail = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const response = await api.get(`/api/Books/${id}`);
      setBook(response.data);
    } catch (error) {
      const message =
        error.response?.data?.error?.message ||
        "Kitap detayı yüklenirken bir hata oluştu.";

      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  const loadBookCopies = async () => {
    try {
      setCopiesLoading(true);

      const response = await api.get(`/api/books/${id}/copies`);
      setCopies(response.data.items || []);
    } catch (error) {
      setCopies([]);
    } finally {
      setCopiesLoading(false);
    }
  };

  const handleAddCopy = async () => {
    setCopyMessage("");
    setCopyError("");

    if (!newBarcode.trim()) {
      setCopyError("Barkod alanı boş olamaz.");
      return;
    }

    try {
      setCopyAddLoading(true);

      await api.post(`/api/books/${id}/copies`, {
        barcode: newBarcode.trim(),
      });

      setNewBarcode("");
      setCopyMessage("Kitap kopyası başarıyla eklendi.");

      await loadBookCopies();
      await loadBookDetail();
    } catch (error) {
      const message =
        error.response?.data?.error?.message ||
        "Kitap kopyası eklenirken bir hata oluştu.";

      setCopyError(message);
    } finally {
      setCopyAddLoading(false);
    }
  };

  const handleCreateReservation = async () => {
    setReservationMessage("");
    setReservationError("");

    if (!accessToken) {
      navigate("/login");
      return;
    }

    if (!isUser) {
      setReservationError("Sadece kullanıcı rolündeki hesaplar kitap ayırtabilir.");
      return;
    }

    try {
      setReservationLoading(true);

      const profileResponse = await api.get("/api/Me/profile");
      const memberId = profileResponse.data.memberId;

      await api.post("/api/Reservations", {
        memberId,
        bookId: Number(id),
        holdMinutes: Number(holdMinutes),
      });

      setReservationMessage("Kitap başarıyla ayırtıldı.");
      await loadBookDetail();
    } catch (error) {
      const message =
        error.response?.data?.error?.message ||
        "Rezervasyon oluşturulurken bir hata oluştu.";

      setReservationError(message);
    } finally {
      setReservationLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={messageStyle}>Kitap detayı yükleniyor...</div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div style={containerStyle}>
        <div style={errorStyle}>{errorMessage}</div>

        <button onClick={() => navigate("/books")} style={backBtnStyle}>
          Kitaplara Dön
        </button>
      </div>
    );
  }

  if (!book) {
    return null;
  }

  const availableCount = book.availableCopyCount ?? 0;
  const totalCount = book.totalCopyCount ?? 0;
  const stockSummary = book.stockSummary || {};

  const canReserve = isUser && totalCount > 0 && availableCount > 0;

  return (
    <div style={containerStyle}>
      <button onClick={() => navigate("/books")} style={backBtnStyle}>
        ← Kitaplara Dön
      </button>

      <div className="card" style={detailCardStyle}>
        <div style={coverStyle}>
          {book.coverImageUrl ? (
            <img src={book.coverImageUrl} alt={book.title} style={coverImageStyle} />
          ) : (
            <span style={{ fontSize: "4rem" }}>📖</span>
          )}
        </div>

        <div style={infoStyle}>
          <h2 style={titleStyle}>{book.title}</h2>

          <p style={rowStyle}>
            <strong>Yazar:</strong> {book.author}
          </p>

          <p style={rowStyle}>
            <strong>Yayıncı:</strong> {book.publisher}
          </p>

          <p style={rowStyle}>
            <strong>ISBN:</strong> {book.isbn}
          </p>

          <p style={rowStyle}>
            <strong>Yayın Yılı:</strong> {book.publishedYear}
          </p>

          <p style={rowStyle}>
            <strong>Dil:</strong> {book.language}
          </p>

          <p style={rowStyle}>
            <strong>Sayfa Sayısı:</strong> {book.pageCount}
          </p>

          <p style={rowStyle}>
            <strong>Kategori:</strong> {book.categoryName}
          </p>

          <p style={rowStyle}>
            <strong>Stok:</strong>{" "}
            <span style={{ color: availableCount > 0 ? "#27ae60" : "#e74c3c" }}>
              {availableCount} / {totalCount} müsait
            </span>
          </p>

          <p style={descriptionStyle}>
            <strong>Açıklama:</strong>
            <br />
            {book.description || "Açıklama bulunmuyor."}
          </p>

          <div style={reservationBoxStyle}>
            {!accessToken && (
              <button onClick={() => navigate("/login")} style={reservationBtnStyle}>
                Kitabı Ayırtmak İçin Giriş Yap
              </button>
            )}

            {accessToken && isUser && (
              <>
                {totalCount === 0 && (
                  <div style={errorSmallStyle}>
                    Bu kitabın fiziksel kopyası olmadığı için ayırtma yapılamaz.
                  </div>
                )}

                {totalCount > 0 && availableCount === 0 && (
                  <div style={errorSmallStyle}>
                    Bu kitabın şu anda ayırtılabilecek müsait kopyası yok.
                  </div>
                )}

                {canReserve && (
                  <>
                    <label style={labelStyle}>Ayırtma Süresi</label>

                    <select
                      value={holdMinutes}
                      onChange={(event) => setHoldMinutes(Number(event.target.value))}
                      style={selectStyle}
                    >
                      <option value={1}>1 dakika</option>
                      <option value={2}>2 dakika</option>
                      <option value={60}>1 saat</option>
                      <option value={720}>12 saat</option>
                      <option value={1440}>24 saat</option>
                    </select>

                    <div style={infoBoxStyle}>
                      Kitabı ayırttığınızda müsait bir fiziksel kopya seçilen süre
                      boyunca sizin için rezerve edilir.
                    </div>

                    <button
                      onClick={handleCreateReservation}
                      style={reservationBtnStyle}
                      disabled={reservationLoading}
                    >
                      {reservationLoading ? "Ayırtılıyor..." : "Kitabı Ayırt"}
                    </button>
                  </>
                )}

                <button
                  onClick={() => navigate("/my-reservations")}
                  style={secondaryBtnStyle}
                >
                  Rezervasyonlarım
                </button>
              </>
            )}

            {reservationMessage && <div style={successStyle}>{reservationMessage}</div>}
            {reservationError && <div style={errorSmallStyle}>{reservationError}</div>}
          </div>
        </div>
      </div>

      <div className="card" style={stockCardStyle}>
        <h3 style={{ marginTop: 0, color: "#2c3e50" }}>Stok Özeti</h3>

        <div style={stockGridStyle}>
          <div style={stockItemStyle}>
            <strong>Toplam</strong>
            <span>{stockSummary.total ?? totalCount}</span>
          </div>

          <div style={stockItemStyle}>
            <strong>Müsait</strong>
            <span>{stockSummary.available ?? availableCount}</span>
          </div>

          <div style={stockItemStyle}>
            <strong>Ödünçte</strong>
            <span>{stockSummary.loaned ?? 0}</span>
          </div>

          <div style={stockItemStyle}>
            <strong>Rezerve</strong>
            <span>{stockSummary.reserved ?? 0}</span>
          </div>

          <div style={stockItemStyle}>
            <strong>İade Onayı Bekleyen</strong>
            <span>{stockSummary.pendingReturnApproval ?? 0}</span>
          </div>
        </div>
      </div>

      {isStaff && (
        <div className="card" style={copiesCardStyle}>
          <h3 style={{ marginTop: 0, color: "#2c3e50" }}>Fiziksel Kopyalar</h3>

          <div style={addCopyBoxStyle}>
            <h4 style={{ marginTop: 0, marginBottom: "10px", color: "#34495e" }}>
              Mevcut Kitaba Yeni Kopya Ekle
            </h4>

            <div style={addCopyRowStyle}>
              <input
                type="text"
                placeholder="Yeni barkod girin. Örn: BRK-001"
                style={barcodeInputStyle}
                value={newBarcode}
                onChange={(event) => setNewBarcode(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    handleAddCopy();
                  }
                }}
              />

              <button
                onClick={handleAddCopy}
                style={addCopyBtnStyle}
                disabled={copyAddLoading}
              >
                {copyAddLoading ? "Ekleniyor..." : "Kopya Ekle"}
              </button>
            </div>

            {copyMessage && <div style={successStyle}>{copyMessage}</div>}
            {copyError && <div style={errorSmallStyle}>{copyError}</div>}
          </div>

          {copiesLoading && <div style={messageStyle}>Kopyalar yükleniyor...</div>}

          {!copiesLoading && copies.length === 0 && (
            <div style={messageStyle}>Bu kitaba ait kopya bulunamadı.</div>
          )}

          {!copiesLoading && copies.length > 0 && (
            <table style={tableStyle}>
              <thead>
                <tr style={tableHeaderStyle}>
                  <th style={thStyle}>ID</th>
                  <th style={thStyle}>Barkod</th>
                  <th style={thStyle}>Durum</th>
                </tr>
              </thead>

              <tbody>
                {copies.map((copy) => (
                  <tr key={copy.id}>
                    <td style={tdStyle}>{copy.id}</td>
                    <td style={tdStyle}>{copy.barcode}</td>
                    <td style={tdStyle}>
                      <span style={copyStatusStyle(copy.status)}>
                        {copy.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

const containerStyle = {
  padding: "40px",
  fontFamily: "sans-serif",
  maxWidth: "1000px",
  margin: "0 auto",
};

const detailCardStyle = {
  display: "flex",
  gap: "30px",
  padding: "30px",
  marginBottom: "25px",
};

const coverStyle = {
  width: "220px",
  height: "320px",
  minWidth: "220px",
  backgroundColor: "#f1f2f6",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "10px",
  overflow: "hidden",
};

const coverImageStyle = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const infoStyle = {
  flex: 1,
};

const titleStyle = {
  marginTop: 0,
  color: "#2c3e50",
};

const rowStyle = {
  color: "#34495e",
  margin: "8px 0",
};

const descriptionStyle = {
  color: "#34495e",
  marginTop: "20px",
  lineHeight: "1.6",
};

const reservationBoxStyle = {
  marginTop: "20px",
  display: "flex",
  flexDirection: "column",
  gap: "10px",
};

const labelStyle = {
  fontSize: "0.85rem",
  fontWeight: "bold",
  color: "#34495e",
};

const selectStyle = {
  padding: "10px",
  borderRadius: "8px",
  border: "1px solid #ddd",
};

const infoBoxStyle = {
  backgroundColor: "#f8f9fa",
  color: "#34495e",
  padding: "10px",
  borderRadius: "8px",
  fontSize: "0.9rem",
};

const reservationBtnStyle = {
  padding: "12px 16px",
  backgroundColor: "#27ae60",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "bold",
};

const secondaryBtnStyle = {
  padding: "12px 16px",
  backgroundColor: "#3498db",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "bold",
};

const stockCardStyle = {
  padding: "25px",
  marginBottom: "25px",
};

const stockGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
  gap: "15px",
};

const stockItemStyle = {
  backgroundColor: "#f8f9fa",
  borderRadius: "8px",
  padding: "15px",
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  color: "#2c3e50",
};

const copiesCardStyle = {
  padding: "25px",
};

const addCopyBoxStyle = {
  backgroundColor: "#f8f9fa",
  border: "1px solid #eee",
  borderRadius: "8px",
  padding: "15px",
  marginBottom: "20px",
};

const addCopyRowStyle = {
  display: "flex",
  gap: "10px",
  marginBottom: "10px",
};

const barcodeInputStyle = {
  flex: 1,
  padding: "10px",
  borderRadius: "8px",
  border: "1px solid #ddd",
  fontSize: "1rem",
};

const addCopyBtnStyle = {
  padding: "10px 16px",
  backgroundColor: "#27ae60",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "bold",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  textAlign: "left",
};

const tableHeaderStyle = {
  backgroundColor: "#f4f4f4",
};

const thStyle = {
  padding: "12px",
  borderBottom: "1px solid #ddd",
};

const tdStyle = {
  padding: "12px",
  borderBottom: "1px solid #eee",
};

const copyStatusStyle = (status) => ({
  padding: "4px 10px",
  borderRadius: "20px",
  fontSize: "0.8rem",
  fontWeight: "bold",
  color: "white",
  backgroundColor:
    status === "Available"
      ? "#27ae60"
      : status === "Reserved"
      ? "#3498db"
      : status === "Loaned"
      ? "#e67e22"
      : status === "PendingReturnApproval"
      ? "#9b59b6"
      : "#7f8c8d",
});

const backBtnStyle = {
  marginBottom: "20px",
  padding: "10px 16px",
  backgroundColor: "#2c3e50",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "bold",
};

const messageStyle = {
  padding: "15px",
  color: "#7f8c8d",
  textAlign: "center",
};

const errorStyle = {
  padding: "15px",
  marginBottom: "20px",
  backgroundColor: "#fdecea",
  color: "#c0392b",
  borderRadius: "8px",
};

const errorSmallStyle = {
  backgroundColor: "#fdecea",
  color: "#c0392b",
  padding: "10px",
  borderRadius: "8px",
  fontSize: "0.9rem",
};

const successStyle = {
  backgroundColor: "#eafaf1",
  color: "#229954",
  padding: "10px",
  borderRadius: "8px",
  fontSize: "0.9rem",
};

export default BookDetail;