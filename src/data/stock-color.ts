// 종목 브랜드 색상(표시용). DB에 없는 순수 프레젠테이션 값 → 코드 해시로 결정적 생성.
// 클라이언트 컴포넌트에서도 쓰이므로 순수 함수로 유지.
const PALETTE = [
  '#1428A0', '#EA002C', '#03C75A', '#F58220', '#1B6CF2',
  '#8E44AD', '#16A085', '#E67E22', '#C0392B', '#2C3E50',
]

export function stockColor(code: string): string {
  let h = 0
  for (let i = 0; i < code.length; i++) h = (h * 31 + code.charCodeAt(i)) >>> 0
  return PALETTE[h % PALETTE.length]
}
