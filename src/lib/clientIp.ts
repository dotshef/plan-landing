// 프록시 헤더에서 클라이언트 IP를 추출한다 (x-forwarded-for 첫 번째 값 우선). 없으면 null.
export function clientIp(req: Request): string | null {
  const xff = req.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim() || null
  return req.headers.get('x-real-ip')?.trim() || null
}
