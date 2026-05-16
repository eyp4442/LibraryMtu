import { useState } from 'react';
import api from '../api/axios'; // Dün kurduğumuz köprü

const AddBook = () => {
  const [bookData, setBookData] = useState({
    title: '',
    author: '',
    isbn: '',
    publishYear: '',
    publisher: '',
    language: '',
    pageCount: '',
    description: '',
    categoryId: '',
    coverImage: '' // Kapak resmi URL veya Base64
  });

  const [barcodes, setBarcodes] = useState(['']); // Kopyalar (Barkodlar)

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBookData({ ...bookData, [name]: value });
  };

  const addBarcodeField = () => setBarcodes([...barcodes, '']);
  
  const handleBarcodeChange = (index, value) => {
    const newBarcodes = [...barcodes];
    newBarcodes[index] = value;
    setBarcodes(newBarcodes);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Backend'e gönderilecek paket
      const payload = { ...bookData, barcodes };
      console.log("Sözleşmeye uygun gönderilen veri:", payload);
      
      // await api.post('/books/add', payload);
      alert(`${bookData.title} ve ${barcodes.length} adet kopya başarıyla eklendi!`);
    } catch (err) {
      alert("Kitap eklenirken bir hata oluştu.");
    }
  };

  return (
    <div style={containerStyle}>
      <h2 style={{ textAlign: 'center', color: '#2c3e50' }}>📚 Yeni Kitap Kaydı (Kazım Paneli)</h2>
      <form onSubmit={handleSubmit} style={formStyle}>
        
        {/* İKİLİ SATIRLAR */}
        <div style={rowStyle}>
          <div style={groupStyle}>
            <label style={labelStyle}>Kitap Adı</label>
            <input type="text" name="title" required style={inputStyle} onChange={handleInputChange} />
          </div>
          <div style={groupStyle}>
            <label style={labelStyle}>Yazar</label>
            <input type="text" name="author" required style={inputStyle} onChange={handleInputChange} />
          </div>
        </div>

        <div style={rowStyle}>
          <div style={groupStyle}>
            <label style={labelStyle}>ISBN</label>
            <input type="text" name="isbn" style={inputStyle} onChange={handleInputChange} />
          </div>
          <div style={groupStyle}>
            <label style={labelStyle}>Kapak Resmi (URL)</label>
            <input type="text" name="coverImage" placeholder="http://..." style={inputStyle} onChange={handleInputChange} />
          </div>
        </div>

        <div style={rowStyle}>
          <div style={groupStyle}>
            <label style={labelStyle}>Yayın Yılı</label>
            <input type="number" name="publishYear" style={inputStyle} onChange={handleInputChange} />
          </div>
          <div style={groupStyle}>
            <label style={labelStyle}>Yayınevi</label>
            <input type="text" name="publisher" style={inputStyle} onChange={handleInputChange} />
          </div>
        </div>

        <div style={rowStyle}>
          <div style={groupStyle}>
            <label style={labelStyle}>Dil</label>
            <input type="text" name="language" style={inputStyle} onChange={handleInputChange} />
          </div>
          <div style={groupStyle}>
            <label style={labelStyle}>Sayfa Sayısı</label>
            <input type="number" name="pageCount" style={inputStyle} onChange={handleInputChange} />
          </div>
        </div>

        <div style={groupStyle}>
          <label style={labelStyle}>Kategori</label>
          <select name="categoryId" style={inputStyle} onChange={handleInputChange}>
            <option value="">Kategori Seçin</option>
            <option value="1">Tarih</option>
            <option value="2">Roman</option>
            <option value="3">Bilim</option>
          </select>
        </div>

        <div style={groupStyle}>
          <label style={labelStyle}>Kitap Açıklaması</label>
          <textarea name="description" style={{...inputStyle, height: '80px'}} onChange={handleInputChange}></textarea>
        </div>

        {/* BARKODLAR BÖLÜMÜ */}
        <div style={barcodeSection}>
          <h4 style={{ margin: '0 0 10px 0' }}>📋 Kitap Kopyaları (Barkodlar)</h4>
          {barcodes.map((barcode, index) => (
            <input 
              key={index}
              type="text" 
              placeholder={`Barkod ${index + 1}`} 
              style={{...inputStyle, marginBottom: '10px'}}
              onChange={(e) => handleBarcodeChange(index, e.target.value)}
            />
          ))}
          <button type="button" onClick={addBarcodeField} style={addBtnStyle}>
            + Yeni Kopya/Barkod Ekle
          </button>
        </div>

        <button type="submit" style={saveBtnStyle}>
          Kitabı ve Kopyaları Sisteme İşle
        </button>
      </form>
    </div>
  );
};

// --- TASARIM STİLLERİ ---
const containerStyle = { padding: '40px', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif' };
const formStyle = { display: 'flex', flexDirection: 'column', gap: '20px', backgroundColor: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' };
const rowStyle = { display: 'flex', gap: '20px' };
const groupStyle = { display: 'flex', flexDirection: 'column', flex: 1 };
const labelStyle = { fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '5px', color: '#34495e' };
const inputStyle = { padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem' };
const barcodeSection = { border: '2px dashed #bdc3c7', padding: '20px', borderRadius: '10px', backgroundColor: '#f9f9f9' };
const addBtnStyle = { backgroundColor: '#3498db', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem' };
const saveBtnStyle = { padding: '15px', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem' };

export default AddBook;