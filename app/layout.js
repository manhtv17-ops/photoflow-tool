import './globals.css'
import { Roboto } from 'next/font/google'

const roboto = Roboto({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '700'],
  display: 'swap',
})

export const metadata = {
  title: 'PhotoFlow – Làm nét & tối ưu ảnh social',
  description:
    'Công cụ tối ưu hình ảnh, upscale và xử lý ảnh trực tiếp trên trình duyệt.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body className={roboto.className}>{children}</body>
    </html>
  )
}
