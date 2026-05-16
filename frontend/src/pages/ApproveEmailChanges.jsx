import { useState, useEffect } from 'react';
import api from '../api/axios';

const ApproveEmailChanges = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Bekleyen İstekleri Çek (Backend: GetPending)
  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const fetchPendingRequests = async () => {
    try {
      const res = await api.get('/email-change-requests/pending');
      setRequests(res.data.items);
      setLoading(false);
    } catch (err) {
      console.error("İstekler yüklenemedi");
      setLoading(false);
    }
  };

  // 2. İsteği Onayla (Backend: Approve)
  const handleApprove = async (id) => {
    if (!window.confirm("Bu e-posta değişikliğini onaylıyor musunuz?")) return;
    try {
      await api.post(`/email-change-requests/${id}/approve`);
      alert("E-posta başarıyla güncellendi.");
      fetchPendingRequests(); // Listeyi yenile
    } catch (err) {
      alert("Onay hatası: " + err.response?.data?.error?.message);
    }
  };

  // 3. İsteği Reddet (Backend: Reject)
  const handleReject = async (id) => {
    const reason = prompt("Reddetme sebebinizi giriniz:");
    if (!reason) return;
    try {
      await api.post(`/email-change-requests/${id}/reject`, { reason });
      alert("İstek reddedildi.");
      fetchPendingRequests();
    } catch (err) {
      alert("Red hatası");
    }
  };

  if (loading) return <div style={{ padding: '20px' }}>Yükleniyor...</div>;

  return (
    <div style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '20px' }}>📧 E-posta Değişiklik Talepleri</h2>
      
      {requests.length === 0 ? (
        <div className="card">Bekleyen talep bulunmamaktadır.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {requests.map(req => (
            <div key={req.id} className="card" style={requestCardStyle}>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Üye ID: {req.MemberId}</div>
                <div style={{ color: '#7f8c8d' }}>Eski: {req.CurrentEmail}</div>
                <div style={{ color: '#27ae60', fontWeight: 'bold' }}>Yeni: {req.NewEmail}</div>
                <div style={{ fontSize: '0.8rem', marginTop: '5px' }}>Tarih: {new Date(req.CreatedAt).toLocaleString()}</div>
              </div>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => handleApprove(req.id)} style={approveBtn}>Onayla</button>
                <button onClick={() => handleReject(req.id)} style={rejectBtn}>Reddet</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Stiller
const requestCardStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px' };
const approveBtn = { padding: '10px 20px', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' };
const rejectBtn = { padding: '10px 20px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' };

export default ApproveEmailChanges;