import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();

  const accessToken = localStorage.getItem("accessToken");
  const role = localStorage.getItem("role");
  const isLoggedIn = !!accessToken;

  const goToPanel = () => {
    if (role === "Admin") {
      navigate("/admin-panel");
    } else if (role === "Librarian") {
      navigate("/lib-dashboard");
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <div style={heroContainer}>
      <div style={overlay}>
        <h1 style={mainTitleStyle}>Kütüphanemize Hoş Geldiniz</h1>

        <p style={subTitleStyle}>
          Binlerce kitaba erişin, emanetlerinizi yönetin ve okuma serüveninizi
          dijitalleştirin. Sisteme erişmek için giriş yapın veya üyelik başvurusu
          oluşturun.
        </p>

        <div style={buttonGroupStyle}>
          {!isLoggedIn && (
            <>
              <button onClick={() => navigate("/login")} style={loginBtnStyle}>
                Giriş Yap
              </button>

              <button onClick={() => navigate("/register")} style={registerBtnStyle}>
                Üye Ol
              </button>
            </>
          )}

          {isLoggedIn && (
            <button onClick={goToPanel} style={loginBtnStyle}>
              Panele Git
            </button>
          )}
        </div>

        <div style={infoLinkStyle} onClick={() => navigate("/books")}>
          Sadece kitaplara göz atmak mı istiyorsunuz?{" "}
          <span style={spanLink}>Kitapları İncele</span>
        </div>
      </div>
    </div>
  );
};

// --- STİLLER ---
const heroContainer = {
  height: "85vh",
  background:
    'linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url("https://images.unsplash.com/photo-1521587760476-6c12a4b040da?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80")',
  backgroundSize: "cover",
  backgroundPosition: "center",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "white",
  textAlign: "center",
  fontFamily: "sans-serif",
};

const overlay = {
  padding: "40px",
  maxWidth: "800px",
  backdropFilter: "blur(3px)",
  borderRadius: "20px",
};

const mainTitleStyle = {
  fontSize: "3.5rem",
  fontWeight: "bold",
  marginBottom: "20px",
  textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
};

const subTitleStyle = {
  fontSize: "1.2rem",
  lineHeight: "1.6",
  marginBottom: "40px",
  opacity: "0.9",
};

const buttonGroupStyle = {
  display: "flex",
  gap: "20px",
  justifyContent: "center",
  marginBottom: "30px",
};

const btnBase = {
  padding: "15px 40px",
  fontSize: "1.1rem",
  fontWeight: "bold",
  borderRadius: "30px",
  border: "none",
  cursor: "pointer",
  transition: "transform 0.2s, box-shadow 0.2s",
};

const loginBtnStyle = {
  ...btnBase,
  backgroundColor: "#3498db",
  color: "white",
  boxShadow: "0 4px 15px rgba(52, 152, 219, 0.4)",
};

const registerBtnStyle = {
  ...btnBase,
  backgroundColor: "#27ae60",
  color: "white",
  boxShadow: "0 4px 15px rgba(39, 174, 96, 0.4)",
};

const infoLinkStyle = {
  marginTop: "20px",
  fontSize: "1rem",
  cursor: "pointer",
  opacity: "0.8",
};

const spanLink = {
  textDecoration: "underline",
  fontWeight: "bold",
  color: "#3498db",
};

export default Home;