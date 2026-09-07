import './globals.css';

export const metadata = {
  title: 'PhotoFlow – Làm nét & tối ưu ảnh social',
  description: 'Công cụ xử lý ảnh trực tiếp trên trình duyệt: làm nét, upscale, resize social và xuất ảnh.'
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
