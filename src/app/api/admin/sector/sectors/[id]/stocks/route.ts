import { NextResponse } from 'next/server'
import { db } from '@/lib/db/server'
import { requireAdmin } from '@/lib/admin/session'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// 섹터에 종목 등록
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const { id: idRaw } = await ctx.params
  const sectorId = Number(idRaw)
  if (!Number.isInteger(sectorId)) return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 })

  let body: { code?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 })
  }

  const code = typeof body.code === 'string' ? body.code.trim() : ''
  if (!/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: '종목 코드는 6자리 숫자여야 합니다.' }, { status: 400 })
  }

  // 종목 마스터 존재 검증 (검색 기능과 동일한 단일 출처)
  const { data: stock } = await db().from('stock').select('code').eq('code', code).maybeSingle()
  if (!stock) return NextResponse.json({ error: '존재하지 않는 종목 코드입니다.' }, { status: 404 })

  const { count } = await db()
    .from('sector_stock')
    .select('code', { count: 'exact', head: true })
    .eq('sector_id', sectorId)

  const { error } = await db()
    .from('sector_stock')
    .insert({ sector_id: sectorId, code, sort_order: (count ?? 0) + 1 })
  if (error) {
    if (error.message.includes('duplicate') || error.message.includes('unique')) {
      return NextResponse.json({ error: '이미 등록된 종목입니다.' }, { status: 409 })
    }
    console.error('[sector/stocks] insert failed:', error)
    return NextResponse.json({ error: '종목 등록에 실패했습니다.' }, { status: 502 })
  }
  return NextResponse.json({ ok: true })
}

// 섹터에서 종목 제외 (?code=)
export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const { id: idRaw } = await ctx.params
  const sectorId = Number(idRaw)
  const code = new URL(req.url).searchParams.get('code') ?? ''
  if (!Number.isInteger(sectorId) || !/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 })
  }

  const { error } = await db()
    .from('sector_stock')
    .delete()
    .eq('sector_id', sectorId)
    .eq('code', code)
  if (error) {
    console.error('[sector/stocks] delete failed:', error)
    return NextResponse.json({ error: '종목 제외에 실패했습니다.' }, { status: 502 })
  }
  return NextResponse.json({ ok: true })
}
