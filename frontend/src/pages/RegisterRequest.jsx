// src/pages/RegisterRequest.jsx
import { useState } from 'react';

const RegisterRequest = () => {
  const [formData, setFormData] = useState({
    fullName: '', email: '', userName: '', password: '', phone: '', address: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Başvuru gönderiliyor:", formData);
    //  nolu maddeye göre mesajı veriyoruz
    alert("Başvurunuz alınmıştır, Kazım (Librarian) onay verince giriş yapabilirsiniz!"); 
  };

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h2>Üyelik Başvurusu</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <input type="text" placeholder="Ad Soyad" required onChange={(e) => setFormData({...formData, fullName: e.target.value})} />
        <input type="email" placeholder="E-posta" required onChange={(e) => setFormData({...formData, email: e.target.value})} />
        <input type="text" placeholder="Kullanıcı Adı" required onChange={(e) => setFormData({...formData, userName: e.target.value})} />
        <input type="password" placeholder="Şifre" required onChange={(e) => setFormData({...formData, password: e.target.value})} />
        <input type="text" placeholder="Telefon" required onChange={(e) => setFormData({...formData, phone: e.target.value})} />
        <textarea placeholder="Adres" onChange={(e) => setFormData({...formData, address: e.target.value})}></textarea>
        <button type="submit" style={{ padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Başvur
        </button>
      </form>
    </div>
  );
};

export default RegisterRequest;