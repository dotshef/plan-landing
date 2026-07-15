import { NextResponse } from 'next/server'
import { db } from '@/lib/db/server'

// 종목 검색: 전 주권(ST) 이름/코드 매칭. 요청 경로는 DB만 읽음.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export interface SearchHit {
  code: string
  name: string
  market: string
}

export async function GET(req: Request) {
  const raw = new URL(req.url).searchParams.get('q')?.trim() ?? ''
  const q = raw.replace(/[,%_()]/g, '')
  if (q.length < 1) return NextResponse.json([] as SearchHit[])

  const { data, error } = await db()
    .from('stock')
    .select('code, name, market')
    .eq('group_code', 'ST')
    .or(`name.ilike.%${q}%,code.ilike.${q}%`)
    .order('name')
    .limit(10)
  if (error) return NextResponse.json([] as SearchHit[])

  const hits: SearchHit[] = (data ?? []).map((r) => ({
    code: r.code as string,
    name: r.name as string,
    market: r.market === 'Q' ? 'KOSDAQ' : 'KOSPI',
  }))
  return NextResponse.json(hits)
}
