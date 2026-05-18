import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

const AddBook = () => {
  const navigate = useNavigate();

  const [bookData, setBookData] = useState({
    title: "",
    author: "",
    isbn: "",
    publishedYear: "",
    publisher: "",
    language: "",
    pageCount: "",
    description: "",
    categoryIds: [],
    coverImageUrl: "",
  });

  const [categories, setCategories] = useState([]);
  const [barcodes, setBarcodes] = useState([""]);
  const [selectedImageFiles, setSelectedImageFiles] = useState([]);

  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
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
      setCategoriesLoading(true);
      setErrorMessage("");

      const response = await api.get("/api/Categories");
      setCategories(response.data.items || []);
    } catch (error) {
      const message =
        error.response?.data?.error?.message ||
        "Kategoriler yüklenirken bir hata oluştu.";

      setErrorMessage(message);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setBookData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleCategoryToggle = (categoryId) => {
    setBookData((previous) => {
      const exists = previous.categoryIds.includes(categoryId);

      return {
        ...previous,
        categoryIds: exists
          ? previous.categoryIds.filter((id) => id !== categoryId)
          : [...previous.categoryIds, categoryId],
      };
    });
  };

  const handleImageFilesChange = (event) => {
    const files = Array.from(event.target.files || []);
    setSelectedImageFiles(files);
  };

  const addBarcodeField = () => {
    setBarcodes((previous) => [...previous, ""]);
  };

  const removeBarcodeField = (index) => {
    setBarcodes((previous) =>
      previous.filter((_, itemIndex) => itemIndex !== index)
    );
  };

  const handleBarcodeChange = (index, value) => {
    const newBarcodes = [...barcodes];
    newBarcodes[index] = value;
    setBarcodes(newBarcodes);
  };

  const validateForm = () => {
    if (!bookData.title.trim()) return "Kitap adı zorunludur.";
    if (!bookData.author.trim()) return "Yazar zorunludur.";
    if (!bookData.isbn.trim()) return "ISBN zorunludur.";

    if (!bookData.publishedYear || Number(bookData.publishedYear) <= 0) {
      return "Yayın yılı 0'dan büyük olmalıdır.";
    }

    if (!bookData.publisher.trim()) return "Yayınevi zorunludur.";
    if (!bookData.language.trim()) return "Dil zorunludur.";

    if (!bookData.pageCount || Number(bookData.pageCount) <= 0) {
      return "Sayfa sayısı 0'dan büyük olmalıdır.";
    }

    if (bookData.categoryIds.length === 0) {
      return "En az bir kategori seçilmelidir.";
    }

    return null;
  };

  const uploadBookImages = async (bookId) => {
    if (selectedImageFiles.length === 0) return;

    const formData = new FormData();

    selectedImageFiles.forEach((file) => {
      formData.append("files", file);
    });

    // URL boşsa ilk yüklenen dosya otomatik kapak olur.
    // URL doluysa URL kapak olarak kalır, dosyalar galeriye eklenir.
    formData.append("setFirstAsCover", String(!bookData.coverImageUrl.trim()));

    await api.post(`/api/Books/${bookId}/images`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    const validationError = validateForm();

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    try {
      setLoading(true);

      const createBookResponse = await api.post("/api/Books", {
        title: bookData.title.trim(),
        author: bookData.author.trim(),
        isbn: bookData.isbn.trim(),
        publishedYear: Number(bookData.publishedYear),
        publisher: bookData.publisher.trim(),
        language: bookData.language.trim(),
        pageCount: Number(bookData.pageCount),
        description: bookData.description.trim(),
        coverImageUrl: bookData.coverImageUrl.trim() || null,
        categoryIds: bookData.categoryIds,
      });

      const createdBook = createBookResponse.data;

      await uploadBookImages(createdBook.id);

      const cleanedBarcodes = barcodes
        .map((barcode) => barcode.trim())
        .filter((barcode) => barcode.length > 0);

      for (const barcode of cleanedBarcodes) {
        await api.post(`/api/books/${createdBook.id}/copies`, {
          barcode,
        });
      }

      setSuccessMessage(
        `${createdBook.title} başarıyla eklendi. ${cleanedBarcodes.length} adet kopya oluşturuldu.`
      );

      setTimeout(() => {
        navigate(`/book/${createdBook.id}`);
      }, 1000);
    } catch (error) {
      const message =
        error.response?.data?.error?.message ||
        "Kitap eklenirken bir hata oluştu.";

      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={containerStyle}>
      <h2 style={{ textAlign: "center", color: "#2c3e50" }}>
        📚 Yeni Kitap Kaydı
      </h2>

      <form onSubmit={handleSubmit} style={formStyle}>
        <div style={rowStyle}>
          <div style={groupStyle}>
            <label style={labelStyle}>Kitap Adı</label>
            <input
              type="text"
              name="title"
              required
              style={inputStyle}
              value={bookData.title}
              onChange={handleInputChange}
            />
          </div>

          <div style={groupStyle}>
            <label style={labelStyle}>Yazar</label>
            <input
              type="text"
              name="author"
              required
              style={inputStyle}
              value={bookData.author}
              onChange={handleInputChange}
            />
          </div>
        </div>

        <div style={rowStyle}>
          <div style={groupStyle}>
            <label style={labelStyle}>ISBN</label>
            <input
              type="text"
              name="isbn"
              required
              style={inputStyle}
              value={bookData.isbn}
              onChange={handleInputChange}
            />
          </div>

          <div style={groupStyle}>
            <label style={labelStyle}>Kapak Resmi URL</label>
            <input
              type="text"
              name="coverImageUrl"
              placeholder="https://..."
              style={inputStyle}
              value={bookData.coverImageUrl}
              onChange={handleInputChange}
            />
          </div>
        </div>

        <div style={groupStyle}>
          <label style={labelStyle}>Bilgisayardan Kapak/Galeri Görselleri</label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            style={inputStyle}
            onChange={handleImageFilesChange}
          />

          <small style={hintStyle}>
            JPG, PNG veya WEBP seçebilirsiniz. Birden fazla dosya seçilebilir.
            URL boşsa ilk seçilen görsel kapak olarak kullanılır.
          </small>

          {selectedImageFiles.length > 0 && (
            <div style={fileListStyle}>
              {selectedImageFiles.map((file) => (
                <span key={`${file.name}-${file.size}`} style={fileItemStyle}>
                  {file.name}
                </span>
              ))}
            </div>
          )}
        </div>

        <div style={rowStyle}>
          <div style={groupStyle}>
            <label style={labelStyle}>Yayın Yılı</label>
            <input
              type="number"
              name="publishedYear"
              required
              style={inputStyle}
              value={bookData.publishedYear}
              onChange={handleInputChange}
            />
          </div>

          <div style={groupStyle}>
            <label style={labelStyle}>Yayınevi</label>
            <input
              type="text"
              name="publisher"
              required
              style={inputStyle}
              value={bookData.publisher}
              onChange={handleInputChange}
            />
          </div>
        </div>

        <div style={rowStyle}>
          <div style={groupStyle}>
            <label style={labelStyle}>Dil</label>
            <input
              type="text"
              name="language"
              required
              style={inputStyle}
              value={bookData.language}
              onChange={handleInputChange}
            />
          </div>

          <div style={groupStyle}>
            <label style={labelStyle}>Sayfa Sayısı</label>
            <input
              type="number"
              name="pageCount"
              required
              style={inputStyle}
              value={bookData.pageCount}
              onChange={handleInputChange}
            />
          </div>
        </div>

        <div style={groupStyle}>
          <label style={labelStyle}>Kategoriler</label>

          <div style={categoryBoxStyle}>
            {categoriesLoading && <span>Kategoriler yükleniyor...</span>}

            {!categoriesLoading && categories.length === 0 && (
              <span>Henüz kategori bulunmuyor.</span>
            )}

            {!categoriesLoading &&
              categories.map((category) => (
                <label key={category.id} style={checkboxLabelStyle}>
                  <input
                    type="checkbox"
                    checked={bookData.categoryIds.includes(category.id)}
                    onChange={() => handleCategoryToggle(category.id)}
                  />
                  {category.name}
                </label>
              ))}
          </div>
        </div>

        <div style={groupStyle}>
          <label style={labelStyle}>Kitap Açıklaması</label>
          <textarea
            name="description"
            style={{ ...inputStyle, height: "90px" }}
            value={bookData.description}
            onChange={handleInputChange}
          />
        </div>

        <div style={barcodeSection}>
          <h4 style={{ margin: "0 0 10px 0" }}>
            📋 Kitap Kopyaları / Barkodlar
          </h4>

          {barcodes.map((barcode, index) => (
            <div key={index} style={barcodeRowStyle}>
              <input
                type="text"
                placeholder={`Barkod ${index + 1}`}
                style={{ ...inputStyle, flex: 1 }}
                value={barcode}
                onChange={(event) =>
                  handleBarcodeChange(index, event.target.value)
                }
              />

              {barcodes.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeBarcodeField(index)}
                  style={removeBtnStyle}
                >
                  Sil
                </button>
              )}
            </div>
          ))}

          <button type="button" onClick={addBarcodeField} style={addBtnStyle}>
            + Yeni Kopya/Barkod Ekle
          </button>
        </div>

        {errorMessage && <div style={errorStyle}>{errorMessage}</div>}
        {successMessage && <div style={successStyle}>{successMessage}</div>}

        <button type="submit" style={saveBtnStyle} disabled={loading}>
          {loading ? "Kaydediliyor..." : "Kitabı ve Kopyaları Sisteme İşle"}
        </button>
      </form>
    </div>
  );
};

const containerStyle = {
  padding: "40px",
  maxWidth: "800px",
  margin: "0 auto",
  fontFamily: "sans-serif",
};

const formStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "20px",
  backgroundColor: "white",
  padding: "30px",
  borderRadius: "12px",
  boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
};

const rowStyle = {
  display: "flex",
  gap: "20px",
};

const groupStyle = {
  display: "flex",
  flexDirection: "column",
  flex: 1,
};

const labelStyle = {
  fontSize: "0.85rem",
  fontWeight: "bold",
  marginBottom: "5px",
  color: "#34495e",
};

const inputStyle = {
  padding: "12px",
  borderRadius: "8px",
  border: "1px solid #ddd",
  fontSize: "1rem",
};

const hintStyle = {
  marginTop: "6px",
  color: "#7f8c8d",
  fontSize: "0.8rem",
};

const fileListStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: "8px",
  marginTop: "10px",
};

const fileItemStyle = {
  backgroundColor: "#ecf0f1",
  padding: "5px 8px",
  borderRadius: "6px",
  fontSize: "0.8rem",
  color: "#34495e",
};

const categoryBoxStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
  gap: "10px",
  border: "1px solid #ddd",
  borderRadius: "8px",
  padding: "12px",
  backgroundColor: "#f8f9fa",
};

const checkboxLabelStyle = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  color: "#34495e",
  fontSize: "0.9rem",
};

const barcodeSection = {
  border: "2px dashed #bdc3c7",
  padding: "20px",
  borderRadius: "10px",
  backgroundColor: "#f9f9f9",
};

const barcodeRowStyle = {
  display: "flex",
  gap: "10px",
  marginBottom: "10px",
};

const addBtnStyle = {
  backgroundColor: "#3498db",
  color: "white",
  border: "none",
  padding: "8px 15px",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "0.9rem",
};

const removeBtnStyle = {
  backgroundColor: "#e74c3c",
  color: "white",
  border: "none",
  padding: "8px 12px",
  borderRadius: "6px",
  cursor: "pointer",
};

const saveBtnStyle = {
  padding: "15px",
  backgroundColor: "#27ae60",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "bold",
  fontSize: "1.1rem",
};

const errorStyle = {
  backgroundColor: "#fdecea",
  color: "#c0392b",
  padding: "12px",
  borderRadius: "8px",
};

const successStyle = {
  backgroundColor: "#eafaf1",
  color: "#229954",
  padding: "12px",
  borderRadius: "8px",
};

export default AddBook;