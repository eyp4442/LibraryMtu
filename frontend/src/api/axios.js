import axios from 'axios';

// 1. Axios örneğini (instance) oluşturuyoruz
const api = axios.create({
  // Backend'in çalıştığı URL buraya gelecek. 
  // Eğer Backend projen 5000 portunda çalışıyorsa burayı o portla güncelle.
  baseURL: 'http://localhost:5000/api', 
  headers: {
    'Content-Type': 'application/json'
  }
});

// 2. İstek Interceptor'ı (Her istek gönderilmeden hemen önce araya girer)
api.interceptors.request.use(
  (config) => {
    // Tarayıcının local storage'ına kaydettiğimiz token'ı alıyoruz
    const token = localStorage.getItem('token');
    
    // Eğer token varsa, isteğin Header (Başlık) kısmına ekliyoruz
    // Bu sayede senin Backend'deki [Authorize] engeline takılmayız
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 3. Yanıt Interceptor'ı (Backend'den cevap geldiğinde çalışır)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Eğer Backend "401 Unauthorized" (Yetkisiz) dönerse, oturum bitmiş demektir
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      // Opsiyonel: window.location.href = '/login'; // Giriş sayfasına atar
    }
    return Promise.reject(error);
  }
);

export default api;