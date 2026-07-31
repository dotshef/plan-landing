import type { Metadata } from 'next'
import localFont from 'next/font/local'
import Script from 'next/script'
import './globals.css'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import NaverWcs from '@/components/tracking/NaverWcs'
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
  metadataBase: new URL('https://www.plankor.kr'),
  title: '투자그룹 플랜 — 종목 분석 & 무료 리포트',
  description: '실시간 시세, 수급, AI 분석까지 한눈에! 전문가 리포트를 무료로 확인하세요.',
  alternates: { canonical: '/' },
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
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-WK69TC4R"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        {/* Google tag (gtag.js) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=AW-17776841330"
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'AW-17776841330');
            gtag('config', 'G-J69YXK6PK9');`}
        </Script>
        {/* Google Tag Manager */}
        <Script id="gtm-init" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-WK69TC4R');`}
        </Script>
        {/* OpenAI Ads measurement pixel */}
        <Script id="openai-ads-pixel-init" strategy="afterInteractive">
          {`window.oaiq = window.oaiq || function () {
              (window.oaiq.q = window.oaiq.q || []).push(arguments);
            };
            oaiq("init", { pixelId: "JYM2uogRGo6SA8nYb1Ff3g" });`}
        </Script>
        <Script
          src="https://bzrcdn.openai.com/sdk/oaiq.min.js"
          strategy="afterInteractive"
        />
        {/* 비즈스프링 로그분석 — 원본은 document.write 방식이라 동적 삽입으로 대체 */}
        <Script id="bslog-init" strategy="afterInteractive">
          {`(function(){
              if (document.getElementById('bslog_script')) return;
              var s = document.createElement('script');
              s.id = 'bslog_script';
              s.type = 'text/javascript';
              s.async = true;
              s.src = 'https://bs-report.lob.kr/ntrace.js?bs_id=bsgroup&bs_m=4183158&t=' + new Date().getTime();
              document.getElementsByTagName('head')[0].appendChild(s);
            })();`}
        </Script>
        {/* 에이스카운터 로그분석 — 원본의 첫 script 태그 앞 삽입을 head appendChild로 대체 */}
        <Script id="acecounter-init" strategy="afterInteractive">
          {`window._AceGID = (function () {
              var Inf = ['plankor.kr', 'www.plankor.kr,plankor.kr', 'AZ3A106068', '1', 'NaPm,Ncisy', '1'];
              var _CI = (!window._AceGID) ? [] : window._AceGID.val;
              var _N = 0;
              if (_CI.join('.').indexOf(Inf[2]) < 0) { _CI.push(Inf); _N = _CI.length; }
              return { o: _N, val: _CI };
            })();
            window._AceCounter = (function () {
              var G = window._AceGID;
              if (G.o == 0) return;
              var _A = G.val[G.o - 1];
              var _U = (_A[4]).replace(/,/g, '_');
              var _sc = document.createElement('script');
              _sc.async = true;
              _sc.src = 'https://cr.acecounter.com/ac.js?gc=' + _A[2] + '&py=' + _A[1] + '&up=' + _U + '&rd=' + (new Date().getTime());
              document.getElementsByTagName('head')[0].appendChild(_sc);
              return _sc.src;
            })();`}
        </Script>
        {/* Cloudflare Turnstile (봇 방지) — explicit 렌더로 발송 시점에 실행 */}
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
          strategy="afterInteractive"
        />
        {/* 네이버 로그분석 */}
        <NaverWcs />
        <Header />
        <main>{children}</main>
        <Footer />
        <Analytics />
      </body>
    </html>
  )
}
