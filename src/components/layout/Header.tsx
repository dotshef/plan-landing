import Link from 'next/link'

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[var(--border-default)]">
      <div className="responsive-header-inner" style={{ maxWidth: 1320, margin: '0 auto', padding: 'var(--header-padding, 14px 28px)', display: 'flex', alignItems: 'center', gap: 32 }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{
            width: 34, height: 34, borderRadius: 9,
            background: 'linear-gradient(135deg,#1B6CF2,#3B82F6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 800, fontSize: 17
          }}>K</div>
          <div style={{ lineHeight: 1.1 }}>
            <div style={{ fontSize: 19, fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>K-Stock</div>
            <div style={{ fontSize: 11, color: '#8B95A1' }}>실시간 시세·종목분석 플랫폼</div>
          </div>
        </Link>
        <div style={{ marginLeft: 'auto' }}>
          <Link
            href="/report"
            style={{
              height: 42, padding: '0 20px', border: 'none', borderRadius: 11,
              background: '#1B6CF2', color: '#fff', fontSize: 14, fontWeight: 700,
              cursor: 'pointer', display: 'inline-flex', alignItems: 'center', textDecoration: 'none'
            }}
          >
            무료 리포트 신청
          </Link>
        </div>
      </div>
    </header>
  )
}
