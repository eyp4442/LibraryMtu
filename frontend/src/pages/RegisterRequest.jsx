// src/pages/RegisterRequest.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

const RegisterRequest = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    username: "",
    password: "",
    phone: "",
    address: "",
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    if (
      !formData.fullName.trim() ||
      !formData.email.trim() ||
      !formData.username.trim() ||
      !formData.password.trim() ||
      !formData.phone.trim() ||
      !formData.address.trim()
    ) {
      setErrorMessage("Tüm alanları doldurmanız gerekiyor.");
      return;
    }

    if (formData.password.trim().length < 6) {
      setErrorMessage("Şifre en az 6 karakter olmalıdır.");
      return;
    }

    try {
      setLoading(true);

      await api.post("/api/Auth/register-request", {
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        username: formData.username.trim(),
        password: formData.password.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
      });

      setSuccessMessage(
        "Başvurunuz alınmıştır. Kütüphane görevlisi onayladıktan sonra giriş yapabilirsiniz."
      );

      setFormData({
        fullName: "",
        email: "",
        username: "",
        password: "",
        phone: "",
        address: "",
      });

      setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (error) {
      const backendMessage =
        error.response?.data?.error?.message ||
        "Başvuru gönderilirken bir hata oluştu.";

      const details = error.response?.data?.error?.details;

      if (Array.isArray(details) && details.length > 0) {
        const detailText = details
          .map((detail) => `${detail.field}: ${detail.message}`)
          .join(", ");

        setErrorMessage(`${backendMessage} (${detailText})`);
      } else {
        setErrorMessage(backendMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={containerStyle}>
      <div className="card" style={cardStyle}>
        <h2 style={titleStyle}>Üyelik Başvurusu</h2>

        <p style={descriptionStyle}>
          Başvurunuz görevli tarafından onaylandıktan sonra sisteme giriş
          yapabilirsiniz.
        </p>

        <form onSubmit={handleSubmit} style={formStyle}>
          <label style={labelStyle}>Ad Soyad</label>
          <input
            type="text"
            name="fullName"
            placeholder="Ad Soyad"
            required
            style={inputStyle}
            value={formData.fullName}
            onChange={handleChange}
          />

          <label style={labelStyle}>E-posta</label>
          <input
            type="email"
            name="email"
            placeholder="ornek@mail.com"
            required
            style={inputStyle}
            value={formData.email}
            onChange={handleChange}
          />

          <label style={labelStyle}>Kullanıcı Adı</label>
          <input
            type="text"
            name="username"
            placeholder="kullaniciadi"
            required
            style={inputStyle}
            value={formData.username}
            onChange={handleChange}
          />

          <label style={labelStyle}>Şifre</label>
          <input
            type="password"
            name="password"
            placeholder="En az 6 karakter"
            required
            style={inputStyle}
            value={formData.password}
            onChange={handleChange}
          />

          <label style={labelStyle}>Telefon</label>
          <input
            type="text"
            name="phone"
            placeholder="0555 555 55 55"
            required
            style={inputStyle}
            value={formData.phone}
            onChange={handleChange}
          />

          <label style={labelStyle}>Adres</label>
          <textarea
            name="address"
            placeholder="Adres"
            required
            rows="4"
            style={inputStyle}
            value={formData.address}
            onChange={handleChange}
          />

          {errorMessage && <div style={errorStyle}>{errorMessage}</div>}

          {successMessage && <div style={successStyle}>{successMessage}</div>}

          <button type="submit" style={submitBtnStyle} disabled={loading}>
            {loading ? "Başvuru gönderiliyor..." : "Başvur"}
          </button>
        </form>
      </div>
    </div>
  );
};

const containerStyle = {
  padding: "40px 20px",
  maxWidth: "520px",
  margin: "0 auto",
  fontFamily: "sans-serif",
};

const cardStyle = {
  padding: "35px",
};

const titleStyle = {
  color: "#2c3e50",
  marginTop: 0,
};

const descriptionStyle = {
  color: "#7f8c8d",
  fontSize: "0.9rem",
  marginBottom: "25px",
};

const formStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
};

const labelStyle = {
  fontSize: "0.85rem",
  fontWeight: "600",
  color: "#34495e",
};

const inputStyle = {
  width: "100%",
  padding: "12px",
  marginBottom: "8px",
  borderRadius: "8px",
  border: "1px solid #ddd",
  boxSizing: "border-box",
  fontFamily: "inherit",
};

const submitBtnStyle = {
  padding: "12px",
  backgroundColor: "#007bff",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "bold",
  marginTop: "10px",
};

const errorStyle = {
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

export default RegisterRequest;