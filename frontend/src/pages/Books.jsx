import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

const Books = () => {
  const navigate = useNavigate();

  const [books, setBooks] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const loadBooks = async (query = "") => {
    try {
      setLoading(true);
      setErrorMessage("");

      const response = await api.get("/api/Books", {
        params: {
          query: query.trim() || undefined,
          page: 1,
          pageSize: 100,
          sortBy: "title",
          sortDirection: "asc",
        },
      });

      setBooks(response.data.items || []);
    } catch (error) {
      const message =
        error.response?.data?.error?.message ||
        "Kitaplar yüklenirken bir hata oluştu.";

      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBooks();
  }, []);

  const categories = useMemo(() => {
    const categoryNames = books
      .map((book) => book.categoryName)
      .filter(Boolean);

    return [...new Set(categoryNames)];
  }, [books]);

  const filteredBooks = useMemo(() => {
    if (!selectedCategory) return books;

    return books.filter((book) => book.categoryName === selectedCategory);
  }, [books, selectedCategory]);

  const handleFilter = () => {
    loadBooks(searchTerm);
  };

  return (
    <div style={{ padding: "40px", maxWidth: "1200px", margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "30px",
        }}
      >
        <h2 style={{ color: "#2c3e50", margin: 0 }}>📚 Kitap Koleksiyonu</h2>

        <div style={{ color: "#7f8c8d", fontSize: "0.9rem" }}>
          Toplam {filteredBooks.length} kitap gösteriliyor
        </div>
      </div>

      <div className="card" style={filterBarStyle}>
        <input
          type="text"
          placeholder="Kitap başlığı, yazar, ISBN veya yayınevi ile ara..."
          style={searchInputStyle}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleFilter();
            }
          }}
        />

        <select
          style={selectStyle}
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="">Tüm Kategoriler</option>

          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>

        <button style={searchBtnStyle} onClick={handleFilter}>
          Filtrele
        </button>
      </div>

      {loading && (
        <div style={messageStyle}>
          Kitaplar yükleniyor...
        </div>
      )}

      {errorMessage && (
        <div style={errorStyle}>
          {errorMessage}
        </div>
      )}

      {!loading && !errorMessage && filteredBooks.length === 0 && (
        <div style={messageStyle}>
          Gösterilecek kitap bulunamadı.
        </div>
      )}

      <div style={gridStyle}>
        {filteredBooks.map((book) => {
          const availableCount = book.availableCopyCount ?? 0;
          const totalCount = book.totalCopyCount ?? 0;
          const isAvailable = availableCount > 0;

          return (
            <div key={book.id} className="card" style={bookCardStyle}>
              <div style={bookCoverStyle}>
                {book.coverImageUrl ? (
                  <img
                    src={book.coverImageUrl}
                    alt={book.title}
                    style={coverImageStyle}
                  />
                ) : (
                  <span style={{ fontSize: "3rem" }}>📖</span>
                )}

                <div style={badgeStyle(isAvailable)}>
                  {isAvailable ? "Mevcut" : "Tükendi"}
                </div>
              </div>

              <div style={{ padding: "15px" }}>
                <h4 style={titleStyle}>{book.title}</h4>
                <p style={authorStyle}>{book.author}</p>

                <div style={infoRowStyle}>
                  <span style={categoryTagStyle}>
                    {book.categoryName || "Kategori Yok"}
                  </span>

                  <span style={{ fontSize: "0.8rem", color: "#95a5a6" }}>
                    Mevcut: {availableCount} / {totalCount}
                  </span>
                </div>

                <button
                  onClick={() => navigate(`/book/${book.id}`)}
                  style={detailBtnStyle}
                >
                  Detayları İncele
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// --- STİLLER ---
const filterBarStyle = {
  display: "flex",
  gap: "15px",
  marginBottom: "40px",
  padding: "15px 25px",
};

const searchInputStyle = {
  flex: 2,
  padding: "12px",
  borderRadius: "8px",
  border: "1px solid #ddd",
  outline: "none",
};

const selectStyle = {
  flex: 1,
  padding: "12px",
  borderRadius: "8px",
  border: "1px solid #ddd",
};

const searchBtnStyle = {
  padding: "0 25px",
  backgroundColor: "#3498db",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "bold",
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
  gap: "30px",
};

const bookCardStyle = {
  padding: 0,
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
  transition: "transform 0.3s ease",
};

const bookCoverStyle = {
  height: "180px",
  backgroundColor: "#f1f2f6",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  position: "relative",
};

const coverImageStyle = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const badgeStyle = (available) => ({
  position: "absolute",
  top: "10px",
  right: "10px",
  padding: "4px 10px",
  borderRadius: "20px",
  fontSize: "0.7rem",
  fontWeight: "bold",
  backgroundColor: available ? "#27ae60" : "#e74c3c",
  color: "white",
});

const titleStyle = {
  margin: "0 0 5px 0",
  color: "#2c3e50",
  fontSize: "1.1rem",
};

const authorStyle = {
  margin: "0 0 15px 0",
  color: "#7f8c8d",
  fontSize: "0.9rem",
};

const infoRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "20px",
};

const categoryTagStyle = {
  backgroundColor: "#f1f2f6",
  padding: "4px 8px",
  borderRadius: "4px",
  fontSize: "0.75rem",
  color: "#34495e",
  fontWeight: "600",
};

const detailBtnStyle = {
  width: "100%",
  padding: "12px",
  backgroundColor: "#fff",
  color: "#3498db",
  border: "2px solid #3498db",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "bold",
};

const messageStyle = {
  padding: "20px",
  textAlign: "center",
  color: "#7f8c8d",
};

const errorStyle = {
  padding: "15px",
  marginBottom: "20px",
  backgroundColor: "#fdecea",
  color: "#c0392b",
  borderRadius: "8px",
};

export default Books;