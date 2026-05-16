// src/pages/Categories.jsx
import { useState } from 'react';

const Categories = () => {
  const [cats, setCats] = useState(['Tarih', 'Bilim Kurgu', 'Edebiyat']);
  const [newCat, setNewCat] = useState('');

  const addCat = () => {
    if(newCat) { setCats([...cats, newCat]); setNewCat(''); }
  };

  return (
    <div style={{ padding: '30px', fontFamily: 'sans-serif' }}>
      <h2>Kategori Yönetimi (Kazım)</h2>
      <div style={{ marginBottom: '20px' }}>
        <input value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="Yeni Kategori Adı" style={{ padding: '8px' }} />
        <button onClick={addCat} style={{ padding: '8px', marginLeft: '5px' }}>Ekle</button>
      </div>
      <ul>
        {cats.map((c, i) => (
          <li key={i} style={{ marginBottom: '10px' }}>
            {c} <button style={{ color: 'red', marginLeft: '10px' }}>Sil</button>
          </li>
        ))}
      </ul>
    </div>
  );
};
export default Categories;