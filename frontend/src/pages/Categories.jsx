// src/pages/Categories.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

const Categories = () => {
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editingCategoryName, setEditingCategoryName] = useState("");

  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    loadCategories();
  }, []);

  const checkAuthorization = () => {
    const token = localStorage.getItem("accessToken");
    const role = localStorage.getItem("role");

    if (!token) {
      navigate("/login");
      return false;
    }

    if (role !== "Admin" && role !== "Librarian") {
      navigate("/");
      return false;
    }

    return true;
  };

  const loadCategories = async () => {
    if (!checkAuthorization()) return;

    try {
      setLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      const response = await api.get("/api/Categories");
      setCategories(response.data.items || []);
    } catch (error) {
      const message =
        error.response?.data?.error?.message ||
        "Kategoriler yüklenirken bir hata oluştu.";

      setErrorMessage(message);

      if (error.response?.status === 401 || error.response?.status === 403) {
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async () => {
    setErrorMessage("");
    setSuccessMessage("");

    if (!newCategoryName.trim()) {
      setErrorMessage("Kategori adı boş olamaz.");
      return;
    }

    try {
      setLoading(true);

      await api.post("/api/Categories", {
        name: newCategoryName.trim(),
      });

      setNewCategoryName("");
      setSuccessMessage("Kategori başarıyla eklendi.");
      await loadCategories();
    } catch (error) {
      const message =
        error.response?.data?.error?.message ||
        "Kategori eklenirken bir hata oluştu.";

      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (category) => {
    setEditingCategoryId(category.id);
    setEditingCategoryName(category.name);
    setErrorMessage("");
    setSuccessMessage("");
  };

  const cancelEdit = () => {
    setEditingCategoryId(null);
    setEditingCategoryName("");
  };

  const handleUpdateCategory = async (id) => {
    setErrorMessage("");
    setSuccessMessage("");

    if (!editingCategoryName.trim()) {
      setErrorMessage("Kategori adı boş olamaz.");
      return;
    }

    try {
      setActionLoadingId(id);

      await api.put(`/api/Categories/${id}`, {
        name: editingCategoryName.trim(),
      });

      setEditingCategoryId(null);
      setEditingCategoryName("");
      setSuccessMessage("Kategori başarıyla güncellendi.");
      await loadCategories();
    } catch (error) {
      const message =
        error.response?.data?.error?.message ||
        "Kategori güncellenirken bir hata oluştu.";

      setErrorMessage(message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteCategory = async (id) => {
    const confirmed = window.confirm(
      "Bu kategoriyi silmek istiyor musunuz? Bu kategoriye bağlı kitap varsa silinemez."
    );

    if (!confirmed) return;

    try {
      setActionLoadingId(id);
      setErrorMessage("");
      setSuccessMessage("");

      await api.delete(`/api/Categories/${id}`);

      setSuccessMessage("Kategori başarıyla silindi.");
      setCategories((previous) => previous.filter((category) => category.id !== id));
    } catch (error) {
      const message =
        error.response?.data?.error?.message ||
        "Kategori silinirken bir hata oluştu.";

      setErrorMessage(message);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div style={containerStyle}>
      <h2 style={{ color: "#2c3e50" }}>Kategori Yönetimi</h2>

      <p style={descriptionStyle}>
        Kitap kategorilerini buradan ekleyebilir, güncelleyebilir veya silebilirsiniz.
      </p>

      <div className="card" style={addCardStyle}>
        <input
          value={newCategoryName}
          onChange={(event) => setNewCategoryName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              handleAddCategory();
            }
          }}
          placeholder="Yeni kategori adı"
          style={inputStyle}
        />

        <button onClick={handleAddCategory} style={addBtnStyle} disabled={loading}>
          {loading ? "İşleniyor..." : "Ekle"}
        </button>
      </div>

      {errorMessage && <div style={errorStyle}>{errorMessage}</div>}

      {successMessage && <div style={successStyle}>{successMessage}</div>}

      {loading && categories.length === 0 && (
        <div style={messageStyle}>Kategoriler yükleniyor...</div>
      )}

      {!loading && categories.length === 0 && !errorMessage && (
        <div className="card" style={emptyStyle}>
          Henüz kategori bulunmuyor.
        </div>
      )}

      {categories.length > 0 && (
        <div className="card" style={listCardStyle}>
          {categories.map((category) => {
            const isEditing = editingCategoryId === category.id;
            const isActionLoading = actionLoadingId === category.id;

            return (
              <div key={category.id} style={categoryRowStyle}>
                {isEditing ? (
                  <input
                    value={editingCategoryName}
                    onChange={(event) => setEditingCategoryName(event.target.value)}
                    style={inputStyle}
                  />
                ) : (
                  <div>
                    <strong>{category.name}</strong>
                    <span style={idStyle}>ID: {category.id}</span>
                  </div>
                )}

                <div style={buttonGroupStyle}>
                  {isEditing ? (
                    <>
                      <button
                        onClick={() => handleUpdateCategory(category.id)}
                        disabled={isActionLoading}
                        style={saveBtnStyle}
                      >
                        Kaydet
                      </button>

                      <button onClick={cancelEdit} style={cancelBtnStyle}>
                        İptal
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => startEdit(category)} style={editBtnStyle}>
                        Düzenle
                      </button>

                      <button
                        onClick={() => handleDeleteCategory(category.id)}
                        disabled={isActionLoading}
                        style={deleteBtnStyle}
                      >
                        Sil
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
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

const addCardStyle = {
  padding: "20px",
  marginBottom: "20px",
  display: "flex",
  gap: "10px",
};

const inputStyle = {
  flex: 1,
  padding: "10px",
  borderRadius: "8px",
  border: "1px solid #ddd",
  fontSize: "1rem",
};

const addBtnStyle = {
  padding: "10px 18px",
  backgroundColor: "#007bff",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "bold",
};

const listCardStyle = {
  padding: "20px",
};

const categoryRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "12px 0",
  borderBottom: "1px solid #eee",
  gap: "15px",
};

const idStyle = {
  marginLeft: "10px",
  color: "#95a5a6",
  fontSize: "0.85rem",
};

const buttonGroupStyle = {
  display: "flex",
  gap: "8px",
};

const editBtnStyle = {
  padding: "7px 12px",
  backgroundColor: "#3498db",
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
};

const saveBtnStyle = {
  padding: "7px 12px",
  backgroundColor: "#27ae60",
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
};

const cancelBtnStyle = {
  padding: "7px 12px",
  backgroundColor: "#bdc3c7",
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
};

const deleteBtnStyle = {
  padding: "7px 12px",
  backgroundColor: "#e74c3c",
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
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

export default Categories;