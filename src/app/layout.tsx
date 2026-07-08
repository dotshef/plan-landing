import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { Analytics } from "@vercel/analytics/next"

const pretendard = localFont({
  src: [
    { path: '../../public/fonts/Pretendard-Regular.otf',   weight: '400', style: 'normal' },
    { path: '../../public/fonts/Pretendard-Medium.otf',    weight: '500', style: 'normal' },
    { path: '../../public/fonts/Pretendard-SemiBold.otf',  weight: '600', style: 'normal' },
    { path: '../../public/fonts/Pretendard-Bold.otf',      weight: '700', style: 'normal' },
    { path: '../../public/fonts/Pretendard-ExtraBold.otf', weight: '800', style: 'normal' },
  ],
  variable: '--font-pretendard',
  display: 'swap',
})

export const metadata: Metadata = {
  title: '투자그룹 플랜 — 종목 분석 & 무료 리포트',
  description: '실시간 시세, 수급, AI 분석까지 한눈에! 전문가 리포트를 무료로 확인하세요.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={pretendard.variable}>
      <body className="font-sans">
        <Header />
        <main>{children}</main>
        <Footer />
        <Analytics />
      </body>
    </html>
  )
}
