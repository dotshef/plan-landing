import type { Metadata } from 'next'
import { listTrialAssets, publicUrl } from '@/lib/storage/trialAssets'
import PageLeadForm from '@/components/common/PageLeadForm'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '추천주 7일 무료 체험 — 투자그룹 플랜',
  description: '딱 7일, 추천주가 문자로 옵니다. 보유 종목 상담 1회, 매매 타이밍 알림 7일. 7일 뒤 자동 종료됩니다.',
  alternates: { canonical: '/trial' },
}

const STEPS = [
  { n: 'STEP 1', title: '시스템 추출', desc: '수급·거래량·재무 조건으로 전 종목을 매일 자동 스크리닝합니다', num: '2,600개 → 80개' },
  { n: 'STEP 2', title: '담당자 검토', desc: '추출된 후보를 담당자가 업종별로 다시 검토합니다', num: '80개 → 3~5개' },
  { n: 'STEP 3', title: '타이밍 발송', desc: '진입 구간과 청산 구간에 도달하면 문자로 알려드립니다', num: '장중 실시간' },
  { n: 'STEP 4', title: '담당자 배정', desc: '체험기간 동안 이용 방법이나 궁금한 사항은 언제든 문의 가능합니다', num: '평일 09~18시' },
]

const SCHEDULE = [
  { day: '1일차', content: '가벼운 유선 상담 및 포트폴리오 점검', form: '유선 상담' },
  { day: '2일차', content: '이번 주 히든주 종목명 공개 + 선정 근거', form: '문자 · 리포트' },
  { day: '3~5일차', content: '진입·청산 구간 알림, 개장 전·마감 정리', form: '문자 · 장중' },
  { day: '5일차', content: '이번 분기 주목받는 섹터 3가지 · 섹터별 주도종목', form: '리포트' },
  { day: '6일차', content: '보유 종목 수급 변화 알림', form: '문자' },
  { day: '7일차', content: '7일 요약 · 이후 이용 안내', form: '문자' },
]

const sectionTitle: React.CSSProperties = { fontSize: 26, fontWeight: 800, color: '#111827', letterSpacing: '-0.02em', margin: '0 0 8px', textAlign: 'center' }
const sectionKicker: React.CSSProperties = { fontSize: 14, fontWeight: 800, color: '#1B6CF2', margin: '0 0 8px', textAlign: 'center' }
const sectionSub: React.CSSProperties = { fontSize: 15, color: '#6B7684', margin: 0, textAlign: 'center' }

export default async function TrialPage() {
  const assets = await listTrialAssets().catch(() => [])
  const sms = assets.filter((a) => a.kind === 'sms')
  const charts = assets.filter((a) => a.kind === 'chart')
  const reviews = assets.filter((a) => a.kind === 'review')

  // 문자캡처·차트 세트 — group_no 기준 짝. 둘 다 있는 세트만 노출.
  const groupNos = [...new Set([...sms, ...charts].map((a) => a.group_no ?? 0))].sort((a, b) => a - b)
  const pairs = groupNos
    .map((g) => ({
      sms: sms.find((a) => (a.group_no ?? 0) === g),
      chart: charts.find((a) => (a.group_no ?? 0) === g),
    }))
    .filter((p) => p.sms || p.chart)

  return (
    <div style={{ background: '#fff' }}>
      {/* 히어로 */}
      <div style={{ background: '#0F1C3D' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '56px 24px' }}>
          <span style={{ display: 'inline-block', fontSize: 14, fontWeight: 800, color: '#0F1C3D', background: '#FBBF24', padding: '5px 12px', borderRadius: 6, marginBottom: 16 }}>
            7일 무료체험
          </span>
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 40px)', fontWeight: 800, color: '#fff', lineHeight: 1.35, margin: 0 }}>
            딱 7일, <span style={{ color: '#60A5FA' }}>추천주</span>가 문자로 옵니다
          </h1>
          <p style={{ fontSize: 16.5, color: '#93A6C9', marginTop: 14, lineHeight: 1.7 }}>
            보유 종목 상담 1회, 매매 타이밍 알림 7일.<br />7일 뒤 자동으로 종료됩니다.
          </p>
          <div style={{ display: 'flex', gap: 8, marginTop: 22, flexWrap: 'wrap' }}>
            <span style={{ background: '#1E2B4F', borderRadius: 10, padding: '12px 16px', fontSize: 14.5, color: '#DBE7FE' }}>📞 1:1 상담 1회</span>
            <span style={{ background: '#1E2B4F', borderRadius: 10, padding: '12px 16px', fontSize: 14.5, color: '#DBE7FE' }}>💬 진입·청산 구간 알림</span>
          </div>
        </div>
      </div>

      {/* 선정 4단계 */}
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '56px 24px' }}>
        <p style={sectionKicker}>어떻게 종목을 고르나</p>
        <h2 style={sectionTitle}>시스템이 걸러내고, 사람이 다시 봅니다</h2>
        <p style={sectionSub}>알림 하나가 나가기까지 네 단계를 거칩니다</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginTop: 30 }}>
          {STEPS.map((s) => (
            <div key={s.n} style={{ border: '1px solid #EEF1F6', borderRadius: 14, padding: '24px 20px', textAlign: 'center', background: '#fff' }}>
              <p style={{ fontSize: 13, fontWeight: 800, color: '#8B95A1', margin: '0 0 6px' }}>{s.n}</p>
              <p style={{ fontSize: 18, fontWeight: 800, color: '#111827', margin: '0 0 8px' }}>{s.title}</p>
              <p style={{ fontSize: 14, color: '#4E5968', lineHeight: 1.65, margin: 0 }}>{s.desc}</p>
              <p style={{ marginTop: 14, paddingTop: 13, borderTop: '1px solid #F2F4F6', fontSize: 14.5, fontWeight: 800, color: '#1B6CF2' }}>{s.num}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 7일 일정 */}
      <div style={{ background: '#F5F7FB' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '56px 24px' }}>
          <p style={sectionKicker}>7일 동안</p>
          <h2 style={sectionTitle}>받아보실 내용 전부입니다</h2>
          <p style={sectionSub}>체험 기간에만 열리는 자료가 함께 나갑니다</p>
          <div style={{ marginTop: 30, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', border: '1px solid #EEF1F6', borderRadius: 14, overflow: 'hidden', minWidth: 560 }}>
              <thead>
                <tr>
                  {['일차', '내용', '형태'].map((h) => (
                    <th key={h} style={{ padding: '14px 20px', fontSize: 13.5, color: '#8B95A1', fontWeight: 600, textAlign: 'left', background: '#F8FAFC', borderBottom: '1px solid #F2F4F6' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SCHEDULE.map((r) => (
                  <tr key={r.day}>
                    <td style={{ padding: '16px 20px', fontSize: 15, fontWeight: 800, color: '#1B6CF2', borderBottom: '1px solid #F2F4F6', width: '14%', whiteSpace: 'nowrap' }}>{r.day}</td>
                    <td style={{ padding: '16px 20px', fontSize: 15, color: '#191F28', borderBottom: '1px solid #F2F4F6' }}>{r.content}</td>
                    <td style={{ padding: '16px 20px', fontSize: 14, color: '#6B7684', borderBottom: '1px solid #F2F4F6', width: '20%', whiteSpace: 'nowrap' }}>{r.form}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 발송 기록 (동적 이미지 — 없으면 섹션 숨김) */}
      {pairs.length > 0 && (
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '56px 24px' }}>
          <p style={sectionKicker}>발송 기록</p>
          <h2 style={sectionTitle}>실제 발송 내역</h2>
          <p style={sectionSub}>보낸 문자와 그 뒤 차트를 그대로 공개합니다</p>
          <div style={{ display: 'grid', gap: 24, marginTop: 30 }}>
            {pairs.map((p, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, alignItems: 'stretch' }}>
                {p.sms && (
                  <div style={{ border: '1px solid #EEF1F6', borderRadius: 14, overflow: 'hidden', background: '#F8FAFC' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={publicUrl(p.sms.storage_path)} alt={p.sms.alt ?? '발송 문자 캡처'} style={{ display: 'block', width: '100%', height: 'auto' }} />
                  </div>
                )}
                {p.chart && (
                  <div style={{ border: '1px solid #EEF1F6', borderRadius: 14, overflow: 'hidden', background: '#F8FAFC' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={publicUrl(p.chart.storage_path)} alt={p.chart.alt ?? '발송 시점 차트'} style={{ display: 'block', width: '100%', height: 'auto' }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 참여자 후기 (동적 이미지 — 없으면 섹션 숨김) */}
      {reviews.length > 0 && (
        <div style={{ background: '#F5F7FB' }}>
          <div style={{ maxWidth: 1120, margin: '0 auto', padding: '56px 24px' }}>
            <p style={sectionKicker}>참여자 후기</p>
            <h2 style={sectionTitle}>체험해보신 분들의 이야기</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginTop: 30 }}>
              {reviews.map((r) => (
                <div key={r.id} style={{ border: '1px solid #EEF1F6', borderRadius: 14, overflow: 'hidden', background: '#fff' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={publicUrl(r.storage_path)} alt={r.alt ?? '참여자 후기'} style={{ display: 'block', width: '100%', height: 'auto' }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CTA + 신청 폼 */}
      <div style={{ background: '#0F1C3D' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '56px 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 32, alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: 'clamp(24px, 4vw, 30px)', fontWeight: 800, color: '#fff', lineHeight: 1.4, margin: 0 }}>
              7일간 직접 확인해보고<br />계속할지 결정하세요
            </h2>
            <p style={{ fontSize: 16, color: '#BFD4FD', marginTop: 12, lineHeight: 1.7 }}>
              신청하시면 담당자가 연락드립니다.<br />7일 뒤 자동으로 종료됩니다.
            </p>
          </div>
          <PageLeadForm
            sourcePage="trial"
            title="무료체험 신청하기"
            subtitle="7일 후 자동 종료 · 수신 거부 언제든 가능"
            submitLabel="무료체험 신청하기"
            successMessage="담당자가 곧 연락드리겠습니다. 7일 뒤 자동으로 종료되며, 수신 거부는 언제든 가능합니다."
          />
        </div>
      </div>
    </div>
  )
}
