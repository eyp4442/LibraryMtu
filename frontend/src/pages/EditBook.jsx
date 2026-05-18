import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/axios";
import { getImageUrl } from "../utils/imageUrl";

const EditBook = () => {
  const { id } = useParams();
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
    coverImageUrl: "",
    categoryIds: [],
  });

  const [categories, setCategories] = useState([]);
  const [bookImages, setBookImages] = useState([]);
  const [selectedImageFiles, setSelectedImageFiles] = useState([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [deletingImageId, setDeletingImageId] = useState(null);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    loadInitialData();
  }, [id]);

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
      setSuccessMessage("");

      const [bookResponse, categoriesResponse] = await Promise.all([
        api.get(`/api/Books/${id}`),
        api.get("/api/Categories"),
      ]);

      const book = bookResponse.data;

      setBookData({
        title: book.title || "",
        author: book.author || "",
        isbn: book.isbn || "",
        publishedYear: book.publishedYear || "",
        publisher: book.publisher || "",
        language: book.language || "",
        pageCount: book.pageCount || "",
        description: book.description || "",
        coverImageUrl: book.coverImageUrl || "",
        categoryIds:
          Array.isArray(book.categoryIds) && book.categoryIds.length > 0
            ? book.categoryIds
            : book.categoryId
            ? [book.categoryId]
            : [],
      });

      setBookImages(book.images || []);
      setCategories(categoriesResponse.data.items || []);
    } catch (error) {
      const message =
        error.response?.data?.error?.message ||
        "Kitap bilgileri yüklenirken bir hata oluştu.";

      setErrorMessage(message);
    } finally {
      setLoading(false);
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

  const handleSave = async (event) => {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    const validationError = validateForm();

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    try {
      setSaving(true);

      await api.put(`/api/Books/${id}`, {
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

      setSuccessMessage("Kitap bilgileri başarıyla güncellendi.");
      await loadInitialData();
    } catch (error) {
      const message =
        error.response?.data?.error?.message ||
        "Kitap güncellenirken bir hata oluştu.";

      setErrorMessage(message);
    } finally {
      setSaving(false);
    }
  };

  const handleUploadImages = async () => {
    setErrorMessage("");
    setSuccessMessage("");

    if (selectedImageFiles.length === 0) {
      setErrorMessage("Yüklenecek görsel seçilmedi.");
      return;
    }

    try {
      setUploadingImages(true);

      const formData = new FormData();

      selectedImageFiles.forEach((file) => {
        formData.append("files", file);
      });

      // Eğer mevcut kapak URL boşsa ilk yüklenen dosya kapak olur.
      // Eğer kapak URL doluysa dosyalar galeriye eklenir.
      formData.append("setFirstAsCover", String(!bookData.coverImageUrl.trim()));

      await api.post(`/api/Books/${id}/images`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setSelectedImageFiles([]);
      setSuccessMessage("Görseller başarıyla yüklendi.");

      await loadInitialData();
    } catch (error) {
      const message =
        error.response?.data?.error?.message ||
        "Görseller yüklenirken bir hata oluştu.";

      setErrorMessage(message);
    } finally {
      setUploadingImages(false);
    }
  };

  const handleDeleteImage = async (imageId) => {
    const confirmed = window.confirm("Bu görseli silmek istiyor musunuz?");

    if (!confirmed) return;

    try {
      setDeletingImageId(imageId);
      setErrorMessage("");
      setSuccessMessage("");

      await api.delete(`/api/Books/${id}/images/${imageId}`);

      setSuccessMessage("Görsel başarıyla silindi.");
      await loadInitialData();
    } catch (error) {
      const message =
        error.response?.data?.error?.message ||
        "Görsel silinirken bir hata oluştu.";

      setErrorMessage(message);
    } finally {
      setDeletingImageId(null);
    }
  };

  const handleGoDetail = () => {
    navigate(`/book/${id}`);
  };

  if (loading) {
    return (
      <div style={containerStyle}>
        <div className="card" style={messageStyle}>
          Kitap bilgileri yükleniyor...
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <h2 style={{ textAlign: "center", color: "#2c3e50" }}>
        Kitap Bilgilerini Düzenle
      </h2>

      <form onSubmit={handleSave} style={formStyle}>
        <div style={rowStyle}>
          <div style={groupStyle}>
            <label style={labelStyle}>Kitap Adı</label>
            <input
              name="title"
              style={inputStyle}
              value={bookData.title}
              onChange={handleInputChange}
            />
          </div>

          <div style={groupStyle}>
            <label style={labelStyle}>Yazar</label>
            <input
              name="author"
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
              name="isbn"
              style={inputStyle}
              value={bookData.isbn}
              onChange={handleInputChange}
            />
          </div>

          <div style={groupStyle}>
            <label style={labelStyle}>Kapak Resmi URL</label>
            <input
              name="coverImageUrl"
              placeholder="https://..."
              style={inputStyle}
              value={bookData.coverImageUrl}
              onChange={handleInputChange}
            />
          </div>
        </div>

        <div style={rowStyle}>
          <div style={groupStyle}>
            <label style={labelStyle}>Yayın Yılı</label>
            <input
              type="number"
              name="publishedYear"
              style={inputStyle}
              value={bookData.publishedYear}
              onChange={handleInputChange}
            />
          </div>

          <div style={groupStyle}>
            <label style={labelStyle}>Yayınevi</label>
            <input
              name="publisher"
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
              name="language"
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
              style={inputStyle}
              value={bookData.pageCount}
              onChange={handleInputChange}
            />
          </div>
        </div>

        <div style={groupStyle}>
          <label style={labelStyle}>Kategoriler</label>

          <div style={categoryBoxStyle}>
            {categories.length === 0 && <span>Henüz kategori bulunmuyor.</span>}

            {categories.map((category) => (
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
          <label style={labelStyle}>Açıklama</label>
          <textarea
            name="description"
            style={{ ...inputStyle, height: "90px" }}
            value={bookData.description}
            onChange={handleInputChange}
          />
        </div>

        <div style={imageSectionStyle}>
          <h3 style={{ marginTop: 0, color: "#2c3e50" }}>Kitap Görselleri</h3>

          <div style={groupStyle}>
            <label style={labelStyle}>Bilgisayardan Yeni Görsel Ekle</label>

            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              style={inputStyle}
              onChange={handleImageFilesChange}
            />

            <small style={hintStyle}>
              JPG, PNG veya WEBP seçebilirsiniz. Birden fazla dosya seçilebilir.
              Kapak URL boşsa ilk yüklenen görsel kapak yapılır.
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

            <button
              type="button"
              onClick={handleUploadImages}
              style={uploadBtnStyle}
              disabled={uploadingImages || selectedImageFiles.length === 0}
            >
              {uploadingImages ? "Görseller yükleniyor..." : "Görselleri Yükle"}
            </button>
          </div>

          <div style={{ marginTop: "20px" }}>
            <h4 style={{ color: "#34495e" }}>Mevcut Görseller</h4>

            {bookImages.length === 0 && (
              <div style={messageStyle}>Bu kitaba ait yüklenmiş görsel yok.</div>
            )}

            {bookImages.length > 0 && (
              <div style={imageGridStyle}>
                {bookImages.map((image) => {
                  const isCover = image.imageUrl === bookData.coverImageUrl;

                  return (
                    <div key={image.id} style={imageCardStyle}>
                      <div style={imagePreviewBoxStyle}>
                        <img
                          src={getImageUrl(image.imageUrl)}
                          alt={image.originalFileName || "Kitap görseli"}
                          style={imagePreviewStyle}
                        />

                        {isCover && <span style={coverBadgeStyle}>Kapak</span>}
                      </div>

                      <div style={imageInfoStyle}>
                        <span style={fileNameStyle}>
                          {image.originalFileName || "Görsel"}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleDeleteImage(image.id)}
                          style={deleteImageBtnStyle}
                          disabled={deletingImageId === image.id}
                        >
                          {deletingImageId === image.id ? "Siliniyor..." : "Sil"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {errorMessage && <div style={errorStyle}>{errorMessage}</div>}
        {successMessage && <div style={successStyle}>{successMessage}</div>}

        <div style={buttonRowStyle}>
          <button type="submit" style={saveBtnStyle} disabled={saving}>
            {saving ? "Kaydediliyor..." : "Kitap Bilgilerini Kaydet"}
          </button>

          <button type="button" style={detailBtnStyle} onClick={handleGoDetail}>
            Detaya Dön
          </button>
        </div>
      </form>
    </div>
  );
};

const containerStyle = {
  padding: "40px",
  maxWidth: "900px",
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

const imageSectionStyle = {
  border: "1px solid #ddd",
  borderRadius: "10px",
  padding: "20px",
  backgroundColor: "#f8f9fa",
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

const uploadBtnStyle = {
  marginTop: "12px",
  padding: "10px 14px",
  backgroundColor: "#3498db",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "bold",
};

const imageGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
  gap: "15px",
};

const imageCardStyle = {
  backgroundColor: "white",
  border: "1px solid #ddd",
  borderRadius: "8px",
  overflow: "hidden",
};

const imagePreviewBoxStyle = {
  height: "150px",
  backgroundColor: "#ecf0f1",
  position: "relative",
};

const imagePreviewStyle = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const coverBadgeStyle = {
  position: "absolute",
  top: "8px",
  right: "8px",
  backgroundColor: "#27ae60",
  color: "white",
  padding: "4px 8px",
  borderRadius: "20px",
  fontSize: "0.75rem",
  fontWeight: "bold",
};

const imageInfoStyle = {
  padding: "10px",
  display: "flex",
  flexDirection: "column",
  gap: "8px",
};

const fileNameStyle = {
  fontSize: "0.8rem",
  color: "#34495e",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const deleteImageBtnStyle = {
  padding: "7px 10px",
  backgroundColor: "#e74c3c",
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: "bold",
};

const buttonRowStyle = {
  display: "flex",
  gap: "10px",
};

const saveBtnStyle = {
  flex: 2,
  padding: "14px",
  backgroundColor: "#27ae60",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "bold",
};

const detailBtnStyle = {
  flex: 1,
  padding: "14px",
  backgroundColor: "#2c3e50",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
};

const messageStyle = {
  padding: "15px",
  color: "#7f8c8d",
  textAlign: "center",
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

export default EditBook;