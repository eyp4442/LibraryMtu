// src/pages/Libraries.jsx
import { useState } from 'react';

const Libraries = () => {
  const [libs, setLibs] = useState([
    { id: 1, name: 'Merkez Kütüphanesi', address: 'Ankara/Çankaya' },
    { id: 2, name: 'Gazi Kütüphanesi', address: 'İstanbul/Beşiktaş' }
  ]);

  return (
    <div style={{ padding: '30px', fontFamily: 'sans-serif' }}>
      <h2>Kütüphane Şubeleri</h2>
      <button style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '5px' }}>
        + Yeni Şube Ekle
      </button>

      <table border="1" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead style={{ backgroundColor: '#ecf0f1' }}>
          <tr>
            <th>Kütüphane Adı</th>
            <th>Adres</th>
            <th>İşlemler</th>
          </tr>
        </thead>
        <tbody>
          {libs.map(lib => (
            <tr key={lib.id} style={{ textAlign: 'center' }}>
              <td style={{ padding: '10px' }}>{lib.name}</td>
              <td>{lib.address}</td>
              <td>
                <button style={{ color: 'blue' }}>Düzenle</button>
                <button style={{ color: 'red', marginLeft: '10px' }}>Sil</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Libraries;