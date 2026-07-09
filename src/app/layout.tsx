import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { Analytics } from "@vercel/analytics/next"

const pretendard = localFont({
  src: '../../public/fonts/PretendardVariable.woff2',
  weight: '100 900',
  style: 'normal',
  variable: '--font-pretendard',
  display: 'swap',
})

// 특정 문구(히어로 배지)에만 사용 — 필요한 굵기 하나만 로드
const maruBuri = localFont({
  src: '../../public/fonts/MaruBuri-SemiBold.otf',
  weight: '600',
  style: 'normal',
  variable: '--font-maruburi',
  display: 'swap',
})

export const metadata: Metadata = {
  title: '투자그룹 플랜 — 종목 분석 & 무료 리포트',
  description: '실시간 시세, 수급, AI 분석까지 한눈에! 전문가 리포트를 무료로 확인하세요.',
  openGraph: {
    title: '투자그룹 플랜 — 종목 분석 & 무료 리포트',
    description: '실시간 시세, 수급, AI 분석까지 한눈에! 전문가 리포트를 무료로 확인하세요.',
    type: 'website',
    locale: 'ko_KR',
    siteName: '투자그룹 플랜',
    images: [
      {
        url: '/images/og-image.png',
        width: 1731,
        height: 909,
        alt: '투자그룹 플랜 — 종목 분석 & 무료 리포트',
      },
    ],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${pretendard.variable} ${maruBuri.variable}`}>
      <body className="font-sans">
        <Header />
        <main>{children}</main>
        <Footer />
        <Analytics />
      </body>
    </html>
  )
}
