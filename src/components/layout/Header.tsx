import Link from 'next/link'
import Image from 'next/image'

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[var(--border-default)]">
      <div className="responsive-header-inner" style={{ maxWidth: 1320, margin: '0 auto', padding: 'var(--header-padding, 14px 28px)', display: 'flex', alignItems: 'center', gap: 'var(--header-gap, 32px)' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', minWidth: 0 }}>
          <Image src="/images/plan-logo.png" alt="투자그룹 플랜" width={34} height={34} style={{ borderRadius: 9, width: 'var(--header-logo-size, 34px)', height: 'var(--header-logo-size, 34px)' }} />
          <div style={{ lineHeight: 1.1 }}>
            <div style={{ fontSize: 'var(--header-brand-size, 19px)', fontWeight: 800, color: '#111827', letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>투자그룹 플랜</div>
          </div>
        </Link>
        <div style={{ marginLeft: 'auto' }}>
          <Link
            href="/report"
            className="stock-report-cta"
            style={{
              height: 'var(--header-cta-height, 50px)', padding: 'var(--header-cta-padding, 0 28px)',
              border: '2px solid #1B6CF2', borderRadius: 12,
              background: '#1B6CF2', color: '#fff', fontSize: 'var(--header-cta-size, 16px)', fontWeight: 800,
              cursor: 'pointer', display: 'inline-flex', alignItems: 'center', textDecoration: 'none', whiteSpace: 'nowrap'
            }}
          >
            무료 리포트 신청
          </Link>
        </div>
      </div>
    </header>
  )
}
