import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

// Sayfa Importları
import Home from "./pages/Home";
import Login from "./pages/Login";
import RegisterRequest from "./pages/RegisterRequest";
import Books from "./pages/Books";
import BookDetail from "./pages/BookDetail";
import UserDashboard from "./pages/UserDashboard";
import MyLoans from "./pages/MyLoans";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import LibrarianDashboard from "./pages/LibrarianDashboard";
import ApproveMembers from "./pages/ApproveMembers";
import ApproveEmailChanges from "./pages/ApproveEmailChanges";
import AddBook from "./pages/AddBook";
import Categories from "./pages/Categories";
import Authors from "./pages/Authors";
import GiveLoan from "./pages/GiveLoan";
import AdminPanel from "./pages/AdminPanel";
import PendingReturns from "./pages/PendingReturns";
import MyReservations from "./pages/MyReservations";
import PendingReservations from "./pages/PendingReservations";
import EditBook from "./pages/EditBook";
import OverdueLoans from "./pages/OverdueLoans";
import ActiveLoans from "./pages/ActiveLoans";

function App() {
  return (
    <Router>
      <Navbar />

      <div style={mainContainerStyle}>
        <Routes>
          {/* Genel / Public Sayfalar */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<RegisterRequest />} />
          <Route path="/books" element={<Books />} />
          <Route path="/book/:id" element={<BookDetail />} />

          {/* Kullanıcı Sayfaları */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={["User"]}>
                <UserDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/my-loans"
            element={
              <ProtectedRoute allowedRoles={["User"]}>
                <MyLoans />
              </ProtectedRoute>
            }
          />

          <Route
            path="/my-reservations"
            element={
              <ProtectedRoute allowedRoles={["User"]}>
                <MyReservations />
              </ProtectedRoute>
            }
          />            

          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRoles={["User"]}>
                <Profile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/edit-profile"
            element={
              <ProtectedRoute allowedRoles={["User"]}>
                <EditProfile />
              </ProtectedRoute>
            }
          />

          {/* Kütüphaneci / Admin Ortak Sayfaları */}
          <Route
            path="/lib-dashboard"
            element={
              <ProtectedRoute allowedRoles={["Admin", "Librarian"]}>
                <LibrarianDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/approve-members"
            element={
              <ProtectedRoute allowedRoles={["Admin", "Librarian"]}>
                <ApproveMembers />
              </ProtectedRoute>
            }
          />

          <Route
            path="/approve-emails"
            element={
              <ProtectedRoute allowedRoles={["Admin", "Librarian"]}>
                <ApproveEmailChanges />
              </ProtectedRoute>
            }
          />

          <Route
            path="/pending-returns"
            element={
              <ProtectedRoute allowedRoles={["Admin", "Librarian"]}>
                <PendingReturns />
              </ProtectedRoute>
            }
          />

          <Route
            path="/active-loans"
            element={
              <ProtectedRoute allowedRoles={["Admin", "Librarian"]}>
                <ActiveLoans />
              </ProtectedRoute>
            }
          />

          <Route
            path="/pending-reservations"
            element={
              <ProtectedRoute allowedRoles={["Admin", "Librarian"]}>
                <PendingReservations />
              </ProtectedRoute>
            }
          />

          <Route
            path="/add-book"
            element={
              <ProtectedRoute allowedRoles={["Admin", "Librarian"]}>
                <AddBook />
              </ProtectedRoute>
            }
          />

          <Route
            path="/books/:id/edit"
            element={
              <ProtectedRoute allowedRoles={["Admin", "Librarian"]}>
                <EditBook />
              </ProtectedRoute>
            }
          />

          <Route
            path="/overdue-loans"
            element={
              <ProtectedRoute allowedRoles={["Admin", "Librarian"]}>
                <OverdueLoans />
              </ProtectedRoute>
            }
          />

          <Route
            path="/categories"
            element={
              <ProtectedRoute allowedRoles={["Admin", "Librarian"]}>
                <Categories />
              </ProtectedRoute>
            }
          />

          <Route
            path="/authors"
            element={
              <ProtectedRoute allowedRoles={["Admin", "Librarian"]}>
                <Authors />
              </ProtectedRoute>
            }
          />

          <Route
            path="/give-loan"
            element={
              <ProtectedRoute allowedRoles={["Admin", "Librarian"]}>
                <GiveLoan />
              </ProtectedRoute>
            }
          />

          {/* Sadece Admin Sayfası */}
          <Route
            path="/admin-panel"
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <AdminPanel />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

const mainContainerStyle = {
  minHeight: "90vh",
  backgroundColor: "#f4f7f6",
  paddingBottom: "50px",
  fontFamily: "sans-serif",
};

export default App;