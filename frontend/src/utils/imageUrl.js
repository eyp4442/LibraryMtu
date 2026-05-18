//Backend görseli /uploads/book-images/abc.jpg döndürürse,
//frontend bunu http://localhost:5086/uploads/book-images/abc.jpg olarak gösterir.

const RAW_API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5086/api";

// VITE_API_BASE_URL çoğu projede http://localhost:5086/api olabilir.
// Ama static dosyalar /api altında değil, http://localhost:5086/uploads/... altında servis edilir.
const STATIC_FILE_BASE_URL = RAW_API_BASE_URL
  .replace(/\/api\/?$/i, "")
  .replace(/\/$/, "");

export const getImageUrl = (url) => {
  if (!url) return "";

  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("data:") ||
    url.startsWith("blob:")
  ) {
    return url;
  }

  const normalizedPath = url.startsWith("/") ? url : `/${url}`;

  return `${STATIC_FILE_BASE_URL}${normalizedPath}`;
};;