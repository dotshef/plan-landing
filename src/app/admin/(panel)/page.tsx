import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import { db } from '@/lib/db/server'
import { can, requireAdmin, toKstTimestamp } from '@/lib/admin/session'
import { card, pageDesc, pageTitle } from '@/components/admin/ui'

export const dynamic = 'force-dynamic'

export const metadata = { title: '대시보드 - 투자그룹 플랜' }

const DAY_MS = 24 * 60 * 60 * 1000

type Filter = { op: 'gte' | 'eq'; column: string; value: string | boolean }

const MAIN_SOURCE: Filter = { op: 'eq', column: 'source_page', value: 'main' }

/** 테이블 행 수(필터는 AND). 조회 실패 시 null(화면에 '-'). */
async function count(table: string, ...filters: Filter[]): Promise<number | null> {
  let q = db().from(table).select('id', { count: 'exact', head: true })
  for (const f of filters) q = f.op === 'gte' ? q.gte(f.column, f.value) : q.eq(f.column, f.value)
  const { count: n, error } = await q
  return error ? null : (n ?? 0)
}

/** 오늘·최근 7일 시작 시각. 신청 시각 컬럼이 KST 벽시계(timestamp)라 비교 기준도 KST 문자열로 만든다. */
function kstRangeStarts(): { today: string; week: string } {
  const now = new Date()
  return {
    today: `${toKstTimestamp(now).slice(0, 10)} 00:00:00`,
    week: `${toKstTimestamp(new Date(now.getTime() - 6 * DAY_MS)).slice(0, 10)} 00:00:00`,
  }
}

function fmt(n: number | null): string {
  return n == null ? '-' : n.toLocaleString('ko-KR')
}

function StatCard({ href, label, today, week }: { href: string; label: string; today: number | null; week: number | null }) {
  return (
    <Link href={href} style={{ ...card, marginBottom: 0, display: 'block', textDecoration: 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13.5, fontWeight: 700, color: '#4E5968' }}>
        {label}
        <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: 12.5, color: '#1B6CF2' }}>
          신청자 보기 <ChevronRight size={15} />
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 10 }}>
        <span style={{ fontSize: 30, fontWeight: 800, color: '#191F28', fontVariantNumeric: 'tabular-nums' }}>{fmt(today)}</span>
        <span style={{ fontSize: 13, color: '#8B95A1', fontWeight: 600 }}>건 (오늘)</span>
      </div>
      <div style={{ marginTop: 4, fontSize: 13, color: '#6B7684' }}>
        최근 7일 <b style={{ color: '#333D4B', fontVariantNumeric: 'tabular-nums' }}>{fmt(week)}</b>건
      </div>
    </Link>
  )
}

export default async function AdminDashboardPage() {
  const admin = await requireAdmin()
  if (!admin) redirect('/admin/login')

  const { today: todayStart, week: weekStart } = kstRangeStarts()

  // member는 고객 신청 접근 권한이 없다 - 건수 카드(신청자 목록으로 연결)도 노출하지 않는다
  if (!can(admin, 'leads')) {
    return (
      <div>
        <h1 style={pageTitle}>안녕하세요, {admin.name || '관리자'}님</h1>
        <p style={pageDesc}>{todayStart.slice(0, 10)} · 왼쪽 메뉴에서 관리할 항목을 선택하세요.</p>
      </div>
    )
  }

  const [reportToday, reportWeek, incomeToday, incomeWeek] = await Promise.all([
    // report_request는 /trial·/sector 등 다른 페이지 신청도 함께 담는다 - 메인(source_page='main')만 센다
    count('report_request', MAIN_SOURCE, { op: 'gte', column: 'requested_at', value: todayStart }),
    count('report_request', MAIN_SOURCE, { op: 'gte', column: 'requested_at', value: weekStart }),
    count('income_request', { op: 'gte', column: 'requested_at', value: todayStart }),
    count('income_request', { op: 'gte', column: 'requested_at', value: weekStart }),
  ])

  return (
    <div>
      <h1 style={pageTitle}>안녕하세요, {admin.name || '관리자'}님</h1>
      <p style={{ ...pageDesc, marginBottom: 24 }}>{todayStart.slice(0, 10)} 기준 현황입니다.</p>

      <h2 style={{ fontSize: 16, fontWeight: 800, color: '#191F28', margin: '0 0 12px' }}>신청 현황</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        <StatCard href="/admin/leads/main" label="메인 페이지 신청 건수" today={reportToday} week={reportWeek} />
        <StatCard href="/admin/leads/income" label="두 번째 월급 페이지 신청 건수" today={incomeToday} week={incomeWeek} />
      </div>
    </div>
  )
}
