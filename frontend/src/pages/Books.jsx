import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Books = () => {
  const navigate = useNavigate();
  
  // Örnek kitap verileri
  const [books] = useState([
    { id: 1, title: 'Nutuk', author: 'Mustafa Kemal Atatürk', category: 'Tarih', stock: 5 },
    { id: 2, title: 'Suç ve Ceza', author: 'Dostoyevski', category: 'Klasik', stock: 0 },
    { id: 3, title: 'Sefiller', author: 'Victor Hugo', category: 'Klasik', stock: 3 },
    { id: 4, title: 'Simyacı', author: 'Paulo Coelho', category: 'Roman', stock: 12 },
    { id: 5, title: '1984', author: 'George Orwell', category: 'Bilim Kurgu', stock: 8 },
  ]);

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h2 style={{ color: '#2c3e50', margin: 0 }}>📚 Kitap Koleksiyonu</h2>
        <div style={{ color: '#7f8c8d', fontSize: '0.9rem' }}>Toplam {books.length} kitap gösteriliyor</div>
      </div>
      
      {/* Filtreleme Barı */}
      <div className="card" style={filterBarStyle}>
        <input 
          type="text" 
          placeholder="Kitap başlığı veya yazar ismi ile ara..." 
          style={searchInputStyle} 
        />
        <select style={selectStyle}>
          <option value="">Tüm Kategoriler</option>
          <option value="tarih">Tarih</option>
          <option value="klasik">Klasik</option>
          <option value="roman">Roman</option>
        </select>
        <button style={searchBtnStyle}>Filtrele</button>
      </div>

      {/* Kitap Grid Yapısı */}
      <div style={gridStyle}>
        {books.map(book => (
          <div key={book.id} className="card" style={bookCardStyle}>
            <div style={bookCoverStyle}>
              <span style={{ fontSize: '3rem' }}>📖</span>
              <div style={badgeStyle(book.stock > 0)}>
                {book.stock > 0 ? 'Mevcut' : 'Tükendi'}
              </div>
            </div>
            
            <div style={{ padding: '15px' }}>
              <h4 style={titleStyle}>{book.title}</h4>
              <p style={authorStyle}>{book.author}</p>
              
              <div style={infoRowStyle}>
                <span style={categoryTagStyle}>{book.category}</span>
                <span style={{ fontSize: '0.8rem', color: '#95a5a6' }}>Adet: {book.stock}</span>
              </div>

              <button 
                onClick={() => navigate(`/book/${book.id}`)}
                style={detailBtnStyle}
              >
                Detayları İncele
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- STİLLER ---
const filterBarStyle = {
  display: 'flex',
  gap: '15px',
  marginBottom: '40px',
  padding: '15px 25px'
};

const searchInputStyle = {
  flex: 2,
  padding: '12px',
  borderRadius: '8px',
  border: '1px solid #ddd',
  outline: 'none'
};

const selectStyle = {
  flex: 1,
  padding: '12px',
  borderRadius: '8px',
  border: '1px solid #ddd'
};

const searchBtnStyle = {
  padding: '0 25px',
  backgroundColor: '#3498db',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  fontWeight: 'bold'
};

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
  gap: '30px'
};

const bookCardStyle = {
  padding: 0,
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.3s ease'
};

const bookCoverStyle = {
  height: '180px',
  backgroundColor: '#f1f2f6',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative'
};

const badgeStyle = (available) => ({
  position: 'absolute',
  top: '10px',
  right: '10px',
  padding: '4px 10px',
  borderRadius: '20px',
  fontSize: '0.7rem',
  fontWeight: 'bold',
  backgroundColor: available ? '#27ae60' : '#e74c3c',
  color: 'white'
});

const titleStyle = { margin: '0 0 5px 0', color: '#2c3e50', fontSize: '1.1rem' };
const authorStyle = { margin: '0 0 15px 0', color: '#7f8c8d', fontSize: '0.9rem' };
const infoRowStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' };

const categoryTagStyle = {
  backgroundColor: '#f1f2f6',
  padding: '4px 8px',
  borderRadius: '4px',
  fontSize: '0.75rem',
  color: '#34495e',
  fontWeight: '600'
};

const detailBtnStyle = {
  width: '100%',
  padding: '12px',
  backgroundColor: '#fff',
  color: '#3498db',
  border: '2px solid #3498db',
  borderRadius: '8px',
  cursor: 'pointer',
  fontWeight: 'bold'
};

export default Books;