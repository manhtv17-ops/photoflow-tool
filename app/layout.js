import './globals.css'
import { Roboto } from 'next/font/google'

const roboto = Roboto({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '700'],
  display: 'swap',
})

export const metadata = {
  title: 'PhotoFlow – Làm nét & tối ưu hình ảnh',
  description:
    'AI Upscale, Natural Photo và Social Preset trực tiếp trên trình duyệt.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body className={roboto.className}>{children}</body>
    </html>
  )
}
