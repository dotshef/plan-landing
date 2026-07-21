// 전화번호 정규화/포맷 유틸. 클라이언트(입력 포맷팅)와 서버(검증) 양쪽에서 공용으로 쓴다.

// 숫자만 남긴 뒤 한국 휴대폰(01[016789]xxxxxxx, 10~11자리)인지 검증한다.
// 유효하면 하이픈 없는 숫자 문자열, 아니면 null.
export function normalizePhone(raw: string): string | null {
  const digits = (raw ?? "").replace(/\D/g, "");
  if (/^01[016789]\d{7,8}$/.test(digits)) return digits;
  return null;
}

// 입력 중 자동 하이픈. 010-0000-0000 형태로 보기 좋게 만든다(검증은 하지 않음).
export function formatPhone(raw: string): string {
  const digits = (raw ?? "").replace(/\D/g, "").slice(0, 11);
  if (digits.length < 4) return digits;
  if (digits.length < 8) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}
