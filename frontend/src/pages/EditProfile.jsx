import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

const EditProfile = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    address: "",
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");

      const response = await api.get("/api/Me/profile");

      setFormData({
        fullName: response.data.fullName || "",
        phone: response.data.phone || "",
        address: response.data.address || "",
      });
    } catch (error) {
      const message =
        error.response?.data?.error?.message ||
        "Profil bilgileri yüklenirken bir hata oluştu.";

      setErrorMessage(message);

      if (error.response?.status === 401 || error.response?.status === 403) {
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    setErrorMessage("");
    setSuccessMessage("");

    if (!formData.fullName.trim() || !formData.phone.trim() || !formData.address.trim()) {
      setErrorMessage("Ad soyad, telefon ve adres alanları zorunludur.");
      return;
    }

    try {
      setSaving(true);

      await api.put("/api/Me/profile", {
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
      });

      setSuccessMessage("Profil bilgileriniz başarıyla güncellendi.");

      setTimeout(() => {
        navigate("/profile");
      }, 800);
    } catch (error) {
      const message =
        error.response?.data?.error?.message ||
        "Profil güncellenirken bir hata oluştu.";

      setErrorMessage(message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate("/profile");
  };

  if (loading) {
    return (
      <div style={containerStyle}>
        <div className="card" style={cardStyle}>
          <p style={messageStyle}>Profil bilgileri yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div className="card" style={cardStyle}>
        <h2>Bilgileri Güncelle</h2>

        <p style={{ color: "#666", fontSize: "0.9rem" }}>
          Değişiklikleri yaptıktan sonra kaydet butonuna basın.
        </p>

        <label style={labelStyle}>Ad Soyad</label>
        <input
          type="text"
          name="fullName"
          placeholder="Ad Soyad"
          style={inputStyle}
          value={formData.fullName}
          onChange={handleChange}
        />

        <label style={labelStyle}>Telefon</label>
        <input
          type="text"
          name="phone"
          placeholder="Telefon"
          style={inputStyle}
          value={formData.phone}
          onChange={handleChange}
        />

        <label style={labelStyle}>Adres</label>
        <textarea
          name="address"
          placeholder="Adres"
          style={inputStyle}
          rows="4"
          value={formData.address}
          onChange={handleChange}
        />

        {errorMessage && <div style={errorStyle}>{errorMessage}</div>}

        {successMessage && <div style={successStyle}>{successMessage}</div>}

        <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
          <button onClick={handleSave} style={saveBtn} disabled={saving}>
            {saving ? "Kaydediliyor..." : "Kaydet"}
          </button>

          <button onClick={handleCancel} style={cancelBtn} disabled={saving}>
            İptal
          </button>
        </div>

        <p style={noteStyle}>
          Not: E-posta değişikliği ayrı onay sürecine bağlıdır. Bu sayfadan sadece
          ad soyad, telefon ve adres güncellenir.
        </p>
      </div>
    </div>
  );
};

const containerStyle = {
  padding: "50px",
  display: "flex",
  justifyContent: "center",
};

const cardStyle = {
  width: "100%",
  maxWidth: "500px",
  padding: "40px",
};

const labelStyle = {
  display: "block",
  marginBottom: "6px",
  fontSize: "0.85rem",
  fontWeight: "600",
  color: "#34495e",
};

const inputStyle = {
  width: "100%",
  padding: "12px",
  marginBottom: "15px",
  borderRadius: "8px",
  border: "1px solid #ddd",
  boxSizing: "border-box",
  fontFamily: "inherit",
};

const saveBtn = {
  flex: 2,
  padding: "12px",
  backgroundColor: "#27ae60",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "bold",
};

const cancelBtn = {
  flex: 1,
  padding: "12px",
  backgroundColor: "#bdc3c7",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
};

const errorStyle = {
  backgroundColor: "#fdecea",
  color: "#c0392b",
  padding: "10px",
  borderRadius: "8px",
  marginTop: "5px",
  fontSize: "0.9rem",
};

const successStyle = {
  backgroundColor: "#eafaf1",
  color: "#229954",
  padding: "10px",
  borderRadius: "8px",
  marginTop: "5px",
  fontSize: "0.9rem",
};

const messageStyle = {
  color: "#7f8c8d",
  textAlign: "center",
};

const noteStyle = {
  marginTop: "20px",
  color: "#7f8c8d",
  fontSize: "0.85rem",
  lineHeight: "1.5",
};

export default EditProfile;