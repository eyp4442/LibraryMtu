// src/pages/Authors.jsx
import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";

const Authors = () => {
  const [books, setBooks] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const response = await api.get("/api/Books", {
        params: {
          page: 1,
          pageSize: 500,
          sortBy: "author",
          sortDirection: "asc",
        },
      });

      setBooks(response.data.items || []);
    } catch (error) {
      const message =
        error.response?.data?.error?.message ||
        "Yazar listesi yüklenirken bir hata oluştu.";

      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  const authors = useMemo(() => {
    const map = new Map();

    books.forEach((book) => {
      const authorName = book.author?.trim();

      if (!authorName) return;

      if (!map.has(authorName)) {
        map.set(authorName, {
          name: authorName,
          bookCount: 0,
          books: [],
        });
      }

      const author = map.get(authorName);
      author.bookCount += 1;
      author.books.push(book.title);
    });

    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name, "tr")
    );
  }, [books]);

  const filteredAuthors = useMemo(() => {
    const value = searchTerm.trim().toLowerCase();

    if (!value) return authors;

    return authors.filter((author) =>
      author.name.toLowerCase().includes(value)
    );
  }, [authors, searchTerm]);

  return (
    <div style={containerStyle}>
      <h2 style={{ color: "#2c3e50" }}>Yazar Listesi</h2>

      <p style={descriptionStyle}>
        Bu liste, sistemde kayıtlı kitapların yazar alanlarından otomatik olarak
        oluşturulur. Mevcut backend yapısında ayrı bir yazar ekleme/silme
        endpoint'i bulunmamaktadır.
      </p>

      <div className="card" style={filterCardStyle}>
        <input
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Yazar adına göre ara..."
          style={searchInputStyle}
        />

        <button onClick={loadBooks} style={refreshBtnStyle}>
          Yenile
        </button>
      </div>

      {loading && <div style={messageStyle}>Yazarlar yükleniyor...</div>}

      {errorMessage && <div style={errorStyle}>{errorMessage}</div>}

      {!loading && filteredAuthors.length === 0 && !errorMessage && (
        <div className="card" style={emptyStyle}>
          Gösterilecek yazar bulunamadı.
        </div>
      )}

      {!loading && filteredAuthors.length > 0 && (
        <>
          <div style={summaryStyle}>
            Toplam {filteredAuthors.length} yazar gösteriliyor.
          </div>

          <div style={gridStyle}>
            {filteredAuthors.map((author) => (
              <div key={author.name} className="card" style={authorCardStyle}>
                <h3 style={authorNameStyle}>{author.name}</h3>

                <p style={bookCountStyle}>
                  Sistemdeki kitap sayısı: <strong>{author.bookCount}</strong>
                </p>

                <div style={bookListStyle}>
                  {author.books.slice(0, 4).map((title) => (
                    <div key={title} style={bookItemStyle}>
                      📖 {title}
                    </div>
                  ))}

                  {author.books.length > 4 && (
                    <div style={moreStyle}>
                      +{author.books.length - 4} kitap daha
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
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
  lineHeight: "1.5",
};

const filterCardStyle = {
  padding: "20px",
  marginBottom: "20px",
  display: "flex",
  gap: "10px",
};

const searchInputStyle = {
  flex: 1,
  padding: "10px",
  borderRadius: "8px",
  border: "1px solid #ddd",
  fontSize: "1rem",
};

const refreshBtnStyle = {
  padding: "10px 18px",
  backgroundColor: "#3498db",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "bold",
};

const summaryStyle = {
  color: "#7f8c8d",
  marginBottom: "15px",
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
  gap: "15px",
};

const authorCardStyle = {
  padding: "20px",
};

const authorNameStyle = {
  color: "#2c3e50",
  marginTop: 0,
  marginBottom: "10px",
};

const bookCountStyle = {
  color: "#34495e",
  fontSize: "0.9rem",
};

const bookListStyle = {
  marginTop: "15px",
  display: "flex",
  flexDirection: "column",
  gap: "8px",
};

const bookItemStyle = {
  backgroundColor: "#f8f9fa",
  padding: "8px",
  borderRadius: "6px",
  color: "#34495e",
  fontSize: "0.85rem",
};

const moreStyle = {
  color: "#7f8c8d",
  fontSize: "0.85rem",
  marginTop: "5px",
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

export default Authors;