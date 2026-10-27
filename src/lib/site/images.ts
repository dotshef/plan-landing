import 'server-only'
import { db } from '@/lib/db/server'
import { toKstTimestamp } from '@/lib/admin/session'
import { readImageSize } from '@/lib/storage/imageSize'
import { removePublicImage, uploadPublicImage } from '@/lib/storage/publicAssets'

// 페이지 고정 이미지 칸(한 칸 = 이미지 한 장) - site_image 테이블. 칸 추가·삭제·문구(alt) 수정 없이 이미지 교체만 한다.
// 행이 없거나 DB 오류면 public/images 기본 이미지로 그린다(화면 우선).
// 교체 이미지는 public-assets 버킷 site/ 폴더에 매번 새 이름으로 올린다(같은 URL 덮어쓰기 시 CDN 캐시 문제 회피).

export type SiteImageKey = 'main_journal_sms' | 'income_deposit'

export interface SiteImage {
  image_url: string
  alt: string
  width: number
  height: number
}

/** 관리자 화면용 - 칸 정보 + 현재 이미지 */
export interface SiteImageSlot extends SiteImage {
  key: SiteImageKey
  label: string
  page: string
  href: string
  updated_at: string | null
}

const SLOTS: Record<SiteImageKey, { label: string; page: string; href: string; fallback: SiteImage }> = {
  main_journal_sms: {
    label: '실제 매매일지와 추천 문자',
    page: '메인 페이지',
    href: '/',
    fallback: {
      image_url: '/images/plan-journal-sms-example.jpg',
      alt: '엑셀 매매일지와 추천 문자 화면 예시: 일자·종목명·매수가·매도가·수익률 내역과 투자그룹 플랜의 매수 시그널 문자. 클릭하면 원본 이미지가 새 탭에서 열립니다.',
      width: 1024,
      height: 721,
    },
  },
  income_deposit: {
    label: '월급날이 한 달에 두 번이 됐습니다',
    page: '두 번째 월급 페이지',
    href: '/income',
    fallback: {
      image_url: '/images/plan-deposit-notifications-example.png',
      alt: '스마트폰 입금 알림 가상 예시: 파란색 배경에 노란색·파란색 은행 알림 두 개가 표시되며, 은행 아이콘과 개인정보·금액은 블러 처리되어 있습니다.',
      width: 1586,
      height: 992,
    },
  },
}

const SLOT_KEYS = Object.keys(SLOTS) as SiteImageKey[]
const STORAGE_FOLDER = 'site'

function isSlotKey(value: string): value is SiteImageKey {
  return (SLOT_KEYS as string[]).includes(value)
}

/** 페이지 렌더용. 실패해도 throw하지 않고 기본 이미지를 돌려준다. */
export async function getSiteImage(key: SiteImageKey): Promise<SiteImage> {
  try {
    const { data, error } = await db()
      .from('site_image')
      .select('image_url, alt, width, height')
      .eq('key', key)
      .maybeSingle()
    if (error) throw new Error(error.message)
    return (data as SiteImage | null) ?? SLOTS[key].fallback
  } catch (e) {
    console.error(`[site_image] ${key} select failed:`, e)
    return SLOTS[key].fallback
  }
}

export async function listSiteImages(): Promise<SiteImageSlot[]> {
  const { data, error } = await db().from('site_image').select('key, image_url, alt, width, height, updated_at')
  if (error) throw new Error(`site_image select: ${error.message}`)
  const rows = new Map((data ?? []).map((r) => [r.key as string, r as SiteImage & { updated_at: string }]))

  return SLOT_KEYS.map((key) => {
    const { label, page, href, fallback } = SLOTS[key]
    const row = rows.get(key)
    return {
      key, label, page, href,
      image_url: row?.image_url ?? fallback.image_url,
      alt: row?.alt ?? fallback.alt,
      width: row?.width ?? fallback.width,
      height: row?.height ?? fallback.height,
      updated_at: row?.updated_at ?? null,
    }
  })
}

/** 이미지 교체. alt는 기존 값을 유지한다. 교체 성공 시 기존 Storage 오브젝트는 지운다(정적 기본 이미지는 그대로). */
export async function replaceSiteImage(key: string, file: File): Promise<void> {
  if (!isSlotKey(key)) throw new Error('이미지 칸을 찾을 수 없습니다.')

  const size = readImageSize(Buffer.from(await file.arrayBuffer()))
  if (!size) throw new Error('JPG·PNG·WebP 이미지만 업로드할 수 있습니다.')

  const { data: row } = await db().from('site_image').select('image_url, alt').eq('key', key).maybeSingle()
  const current = (row as Pick<SiteImage, 'image_url' | 'alt'> | null) ?? SLOTS[key].fallback

  const imageUrl = await uploadPublicImage(file, STORAGE_FOLDER)
  const { error } = await db()
    .from('site_image')
    .upsert({ key, alt: current.alt, image_url: imageUrl, ...size, updated_at: toKstTimestamp() })
  if (error) {
    await removePublicImage(imageUrl)
    throw new Error('이미지 정보를 저장하지 못했습니다.')
  }
  await removePublicImage(current.image_url)
}
