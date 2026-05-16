// src/pages/ApproveMembers.jsx
import { useState } from 'react';

const ApproveMembers = () => {
  const [pendingUsers, setPendingUsers] = useState([
    { id: 1, name: 'Mükremin Akdaş', email: 'mikda@mail.com', date: '2023-10-25' },
    { id: 2, name: 'Eyüp Sabri', email: 'eyup@mail.com', date: '2023-10-26' }
  ]);

  const handleApprove = (id) => {
    alert(id + " ID'li üye onaylandı! Artık sisteme giriş yapabilir.");
    setPendingUsers(pendingUsers.filter(user => user.id !== id));
  };

  return (
    <div style={{ padding: '30px', fontFamily: 'sans-serif' }}>
      <h2>Üyelik Onay Bekleyenler</h2>
      <table border="1" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
        <thead>
          <tr style={{ backgroundColor: '#eee' }}>
            <th>Ad Soyad</th>
            <th>E-posta</th>
            <th>Başvuru Tarihi</th>
            <th>İşlem</th>
          </tr>
        </thead>
        <tbody>
          {pendingUsers.map(user => (
            <tr key={user.id} style={{ textAlign: 'center' }}>
              <td style={{ padding: '10px' }}>{user.name}</td>
              <td>{user.email}</td>
              <td>{user.date}</td>
              <td>
                <button onClick={() => handleApprove(user.id)} style={{ backgroundColor: 'green', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer', borderRadius: '4px' }}>Onayla</button>
                <button style={{ backgroundColor: 'red', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer', borderRadius: '4px', marginLeft: '5px' }}>Reddet</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ApproveMembers;