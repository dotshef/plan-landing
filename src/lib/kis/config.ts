// KIS Open API 공통 설정. 실전(운영) 도메인.
export const KIS_BASE_URL = 'https://openapi.koreainvestment.com:9443'

// 레이트리밋: 명목 20/초이나 실측상 근접 시 EGW00201 → 여유롭게 큐잉(KIS_INGESTION.md §3).
export const KIS_RATE_PER_SEC = 12

// 개별 콜 EGW00201(초당 초과) 백오프 재시도.
export const KIS_RATE_LIMIT_CODE = 'EGW00201'
export const KIS_MAX_RETRIES = 4
