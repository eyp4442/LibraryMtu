// src/pages/AdminPanel.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

const AdminPanel = () => {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBooks: 0,
    pendingMembers: 0,
    pendingEmailChanges: 0,
  });

  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    role: "Librarian",
  });

  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    loadAdminPanel();
  }, []);

  const loadAdminPanel = async () => {
    const token = localStorage.getItem("accessToken");
    const role = localStorage.getItem("role");

    if (!token) {
      navigate("/login");
      return;
    }

    if (role !== "Admin") {
      navigate("/");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      const [
        usersResponse,
        booksResponse,
        pendingMembersResponse,
        pendingEmailsResponse,
      ] = await Promise.all([
        api.get("/api/UserManagement"),
        api.get("/api/Books", {
          params: {
            page: 1,
            pageSize: 1,
          },
        }),
        api.get("/api/registration-requests/pending"),
        api.get("/api/email-change-requests/pending"),
      ]);

      const loadedUsers = usersResponse.data.items || [];

      setUsers(loadedUsers);

      setStats({
        totalUsers: loadedUsers.length,
        totalBooks: booksResponse.data.total || 0,
        pendingMembers: pendingMembersResponse.data.items?.length || 0,
        pendingEmailChanges: pendingEmailsResponse.data.items?.length || 0,
      });
    } catch (error) {
      const message =
        error.response?.data?.error?.message ||
        "Admin panel bilgileri yüklenirken bir hata oluştu.";

      setErrorMessage(message);

      if (error.response?.status === 401 || error.response?.status === 403) {
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNewUserChange = (event) => {
    const { name, value } = event.target;

    setNewUser((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleCreateUser = async (event) => {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    if (!newUser.username.trim() || !newUser.password.trim() || !newUser.role) {
      setErrorMessage("Kullanıcı adı, şifre ve rol zorunludur.");
      return;
    }

    if (newUser.password.trim().length < 6) {
      setErrorMessage("Şifre en az 6 karakter olmalıdır.");
      return;
    }

    try {
      setCreating(true);

      await api.post("/api/UserManagement", {
        username: newUser.username.trim(),
        password: newUser.password.trim(),
        role: newUser.role,
      });

      setSuccessMessage("Kullanıcı başarıyla oluşturuldu.");

      setNewUser({
        username: "",
        password: "",
        role: "Librarian",
      });

      await loadAdminPanel();
    } catch (error) {
      const message =
        error.response?.data?.error?.message ||
        "Kullanıcı oluşturulurken bir hata oluştu.";

      setErrorMessage(message);
    } finally {
      setCreating(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    const confirmed = window.confirm(
      `Bu kullanıcının rolünü ${newRole} yapmak istiyor musunuz?`
    );

    if (!confirmed) return;

    try {
      setActionLoadingId(userId);
      setErrorMessage("");
      setSuccessMessage("");

      await api.put(`/api/UserManagement/${userId}/role`, {
        role: newRole,
      });

      setSuccessMessage("Kullanıcı rolü başarıyla güncellendi.");

      setUsers((previous) =>
        previous.map((user) =>
          user.id === userId ? { ...user, role: newRole } : user
        )
      );
    } catch (error) {
      const message =
        error.response?.data?.error?.message ||
        "Kullanıcı rolü güncellenirken bir hata oluştu.";

      setErrorMessage(message);
    } finally {
      setActionLoadingId(null);
    }
  };

  if (loading) {
    return (
      <div style={containerStyle}>
        <div className="card" style={messageCardStyle}>
          Admin paneli yükleniyor...
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <h1 style={{ color: "#2c3e50" }}>Sistem Admin Paneli 👑</h1>

      <p style={descriptionStyle}>
        Kullanıcıları, rolleri ve sistem genel durumunu buradan yönetebilirsiniz.
      </p>

      {errorMessage && <div style={errorStyle}>{errorMessage}</div>}

      {successMessage && <div style={successStyle}>{successMessage}</div>}

      <div style={statsGridStyle}>
        <div style={adminCardStyle}>
          <h3>{stats.totalUsers}</h3>
          <p>Toplam Kullanıcı</p>
        </div>

        <div style={adminCardStyle}>
          <h3>{stats.totalBooks}</h3>
          <p>Toplam Kitap</p>
          <button onClick={() => navigate("/add-book")} style={adminBtnStyle}>
            Kitap Ekle
          </button>
        </div>

        <div style={adminCardStyle}>
          <h3>{stats.pendingMembers}</h3>
          <p>Bekleyen Üyelik Başvurusu</p>
          <button
            onClick={() => navigate("/approve-members")}
            style={adminBtnStyle}
          >
            Üye Onayları
          </button>
        </div>

        <div style={adminCardStyle}>
          <h3>{stats.pendingEmailChanges}</h3>
          <p>Bekleyen E-posta Talebi</p>
          <button
            onClick={() => navigate("/approve-emails")}
            style={adminBtnStyle}
          >
            E-posta Onayları
          </button>
        </div>
      </div>

      <div className="card" style={sectionStyle}>
        <h3 style={{ marginTop: 0, color: "#2c3e50" }}>
          Yeni Sistem Kullanıcısı Oluştur
        </h3>

        <p style={descriptionStyle}>
          Bu alan Admin veya Librarian gibi sistem personeli oluşturmak için
          kullanılmalıdır. Normal üyeler için üyelik başvuru/onay akışı daha
          doğrudur.
        </p>

        <form onSubmit={handleCreateUser} style={createFormStyle}>
          <input
            type="text"
            name="username"
            placeholder="Kullanıcı adı"
            style={inputStyle}
            value={newUser.username}
            onChange={handleNewUserChange}
          />

          <input
            type="password"
            name="password"
            placeholder="Şifre"
            style={inputStyle}
            value={newUser.password}
            onChange={handleNewUserChange}
          />

          <select
            name="role"
            style={inputStyle}
            value={newUser.role}
            onChange={handleNewUserChange}
          >
            <option value="Admin">Admin</option>
            <option value="Librarian">Librarian</option>
          </select>

          <button type="submit" style={createBtnStyle} disabled={creating}>
            {creating ? "Oluşturuluyor..." : "Kullanıcı Oluştur"}
          </button>
        </form>
      </div>

      <div className="card" style={sectionStyle}>
        <h3 style={{ marginTop: 0, color: "#2c3e50" }}>Kullanıcı ve Rol Yönetimi</h3>

        {users.length === 0 ? (
          <div style={messageCardStyle}>Kullanıcı bulunamadı.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={tableStyle}>
              <thead>
                <tr style={tableHeaderStyle}>
                  <th style={thStyle}>Kullanıcı ID</th>
                  <th style={thStyle}>Kullanıcı Adı</th>
                  <th style={thStyle}>Mevcut Rol</th>
                  <th style={thStyle}>Rol Değiştir</th>
                </tr>
              </thead>

              <tbody>
                {users.map((user) => (
                  <tr key={user.id} style={{ textAlign: "center" }}>
                    <td style={tdStyle}>{user.id}</td>
                    <td style={tdStyle}>{user.username}</td>
                    <td style={tdStyle}>
                      <span style={roleBadgeStyle(user.role)}>{user.role || "-"}</span>
                    </td>
                    <td style={tdStyle}>
                      <select
                        value={user.role || ""}
                        onChange={(event) =>
                          handleRoleChange(user.id, event.target.value)
                        }
                        disabled={actionLoadingId === user.id}
                        style={selectStyle}
                      >
                        <option value="Admin">Admin</option>
                        <option value="Librarian">Librarian</option>
                        <option value="User">User</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card" style={sectionStyle}>
        <h3 style={{ marginTop: 0, color: "#2c3e50" }}>Hızlı Yönetim Linkleri</h3>

        <div style={buttonGroupStyle}>
          <button onClick={() => navigate("/lib-dashboard")} style={quickBtnStyle}>
            Yönetim Paneli
          </button>

          <button onClick={() => navigate("/categories")} style={quickBtnStyle}>
            Kategoriler
          </button>

          <button onClick={() => navigate("/give-loan")} style={quickBtnStyle}>
            Ödünç Ver
          </button>

          <button onClick={() => navigate("/books")} style={quickBtnStyle}>
            Kitapları Gör
          </button>
        </div>
      </div>
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

const statsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "20px",
  marginTop: "20px",
};

const adminCardStyle = {
  padding: "20px",
  backgroundColor: "#2c3e50",
  color: "white",
  borderRadius: "10px",
};

const adminBtnStyle = {
  marginTop: "10px",
  padding: "8px 15px",
  cursor: "pointer",
  backgroundColor: "#f1c40f",
  border: "none",
  borderRadius: "4px",
  fontWeight: "bold",
};

const sectionStyle = {
  marginTop: "30px",
  padding: "20px",
};

const createFormStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "10px",
};

const inputStyle = {
  padding: "10px",
  borderRadius: "8px",
  border: "1px solid #ddd",
};

const createBtnStyle = {
  padding: "10px",
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

const selectStyle = {
  padding: "8px",
  borderRadius: "6px",
  border: "1px solid #ddd",
};

const roleBadgeStyle = (role) => ({
  display: "inline-block",
  padding: "5px 10px",
  borderRadius: "20px",
  color: "white",
  fontWeight: "bold",
  fontSize: "0.8rem",
  backgroundColor:
    role === "Admin"
      ? "#8e44ad"
      : role === "Librarian"
      ? "#2980b9"
      : "#27ae60",
});

const buttonGroupStyle = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
};

const quickBtnStyle = {
  padding: "10px 15px",
  backgroundColor: "#34495e",
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: "bold",
};

const messageCardStyle = {
  padding: "20px",
  color: "#7f8c8d",
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

export default AdminPanel;