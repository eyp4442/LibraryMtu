// src/pages/BookDetail.jsx
import { useParams } from 'react-router-dom';

const BookDetail = () => {
  const { id } = useParams(); // URL'den kitap ID'sini alırız

  // Örnek kitap verisi (Döküman 92-100. maddelerdeki alanlar)
  const book = {
    title: 'Nutuk',
    author: 'Mustafa Kemal Atatürk',
    publisher: 'İş Bankası Yayınları',
    isbn: '9789754580000',
    description: 'Milli Mücadele dönemini birinci ağızdan anlatan eser.',
    copies: [
      { barcode: 'BRK001', status: 'Rafta', location: 'A-12' },
      { barcode: 'BRK002', status: 'Ödünç Verildi', location: 'A-12' }
    ]
  };

  return (
    <div style={{ padding: '30px', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h2>{book.title}</h2>
      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
        <div style={{ width: '200px', height: '300px', backgroundColor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          Kitap Kapağı
        </div>
        <div>
          <p><strong>Yazar:</strong> {book.author}</p>
          <p><strong>Yayıncı:</strong> {book.publisher}</p>
          <p><strong>ISBN:</strong> {book.isbn}</p>
          <p><strong>Açıklama:</strong> {book.description}</p>
        </div>
      </div>

      <h3>Kütüphane Kopyaları</h3>
      <table border="1" cellPadding="10" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ backgroundColor: '#f4f4f4' }}>
            <th>Barkod</th>
            <th>Durum</th>
            <th>Konum</th>
            <th>İşlem</th>
          </tr>
        </thead>
        <tbody>
          {book.copies.map((copy) => (
            <tr key={copy.barcode}>
              <td>{copy.barcode}</td>
              <td style={{ color: copy.status === 'Rafta' ? 'green' : 'red' }}>{copy.status}</td>
              <td>{copy.location}</td>
              <td>
                <button disabled={copy.status !== 'Rafta'}>Ödünç Al</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default BookDetail;