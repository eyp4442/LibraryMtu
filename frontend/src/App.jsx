import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';

// Sayfa Importları
import Home from './pages/Home';
import Login from './pages/Login';
import RegisterRequest from './pages/RegisterRequest';
import Books from './pages/Books';
import BookDetail from './pages/BookDetail';
import UserDashboard from './pages/UserDashboard';
import MyLoans from './pages/MyLoans';
import Profile from './pages/Profile';
import EditProfile from './pages/EditProfile'; // Profil Düzenleme Sayfası
import LibrarianDashboard from './pages/LibrarianDashboard';
import ApproveMembers from './pages/ApproveMembers';
import ApproveEmailChanges from './pages/ApproveEmailChanges'; // Mail Onay Sayfası
import AddBook from './pages/AddBook';
import Categories from './pages/Categories';
import Authors from './pages/Authors';
import GiveLoan from './pages/GiveLoan';
import AdminPanel from './pages/AdminPanel';
import Libraries from './pages/Libraries';

function App() {
  return (
    <Router>
      {/* Navbar her sayfada üstte görünecek */}
      <Navbar />
      
      {/* Sayfa İçerik Alanı */}
      <div style={mainContainerStyle}>
        <Routes>
          {/* Genel Sayfalar */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<RegisterRequest />} />
          <Route path="/books" element={<Books />} />
          <Route path="/book/:id" element={<BookDetail />} />

          {/* Kullanıcı (Üye) Sayfaları */}
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="/my-loans" element={<MyLoans />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/edit-profile" element={<EditProfile />} />

          {/* Kütüphaneci (Librarian) Sayfaları */}
          <Route path="/lib-dashboard" element={<LibrarianDashboard />} />
          <Route path="/approve-members" element={<ApproveMembers />} />
          <Route path="/approve-emails" element={<ApproveEmailChanges />} />
          <Route path="/add-book" element={<AddBook />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/authors" element={<Authors />} />
          <Route path="/give-loan" element={<GiveLoan />} />

          {/* Admin Sayfaları */}
          <Route path="/admin-panel" element={<AdminPanel />} />
          <Route path="/libraries" element={<Libraries />} />
        </Routes>
      </div>
    </Router>
  );
}

// Ana içerik alanı için temel stil
const mainContainerStyle = {
  minHeight: '90vh',
  backgroundColor: '#f4f7f6', // Sözleşmeye uygun kurumsal gri-beyaz tonu
  paddingBottom: '50px',
  fontFamily: 'sans-serif'
};

export default App;