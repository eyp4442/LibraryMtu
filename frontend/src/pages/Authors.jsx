// src/pages/Authors.jsx
import { useState } from 'react';

const Authors = () => {
  const [authors, setAuthors] = useState(['Mustafa Kemal Atatürk', 'Dostoyevski', 'Victor Hugo']);
  const [newAuthor, setNewAuthor] = useState('');

  const addAuthor = () => {
    if(newAuthor) { setAuthors([...authors, newAuthor]); setNewAuthor(''); }
  };

  return (
    <div style={{ padding: '30px', fontFamily: 'sans-serif' }}>
      <h2>Yazar Yönetimi (Kazım)</h2>
      <div style={{ marginBottom: '20px' }}>
        <input 
          value={newAuthor} 
          onChange={(e) => setNewAuthor(e.target.value)} 
          placeholder="Yazar Adı Soyadı" 
          style={{ padding: '8px', width: '250px' }} 
        />
        <button onClick={addAuthor} style={{ padding: '8px 15px', marginLeft: '5px', cursor: 'pointer' }}>Ekle</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
        {authors.map((author, index) => (
          <div key={index} style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {author}
            <button style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer' }}>Sil</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Authors;