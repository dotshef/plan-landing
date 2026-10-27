import 'server-only'

// JPG·PNG·WebP 헤더에서 픽셀 크기만 읽는다(디코딩 없음, 의존성 없음). 형식을 못 알아보면 null.
// JPEG EXIF 회전은 반영하지 않는다 - 저장된 픽셀 방향 그대로의 크기.

export interface ImageSize { width: number; height: number }

function pngSize(b: Buffer): ImageSize | null {
  if (b.length < 24 || b.readUInt32BE(0) !== 0x89504e47 || b.toString('ascii', 12, 16) !== 'IHDR') return null
  return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) }
}

function webpSize(b: Buffer): ImageSize | null {
  if (b.length < 30 || b.toString('ascii', 0, 4) !== 'RIFF' || b.toString('ascii', 8, 12) !== 'WEBP') return null
  const chunk = b.toString('ascii', 12, 16)
  if (chunk === 'VP8 ') return { width: b.readUInt16LE(26) & 0x3fff, height: b.readUInt16LE(28) & 0x3fff }
  if (chunk === 'VP8L') {
    const bits = b.readUInt32LE(21)
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 }
  }
  if (chunk === 'VP8X') return { width: b.readUIntLE(24, 3) + 1, height: b.readUIntLE(27, 3) + 1 }
  return null
}

// SOF0~15 중 DHT(C4)·JPG(C8)·DAC(CC)를 뺀 마커가 프레임 크기를 담는다
const JPEG_SOF = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf])

function jpegSize(b: Buffer): ImageSize | null {
  if (b.length < 4 || b[0] !== 0xff || b[1] !== 0xd8) return null
  let i = 2
  while (i + 9 < b.length) {
    if (b[i] !== 0xff) return null
    const marker = b[i + 1]
    if (marker === 0xff) { i += 1; continue } // 채움 바이트
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd9)) { i += 2; continue } // 길이 없는 마커
    if (JPEG_SOF.has(marker)) return { width: b.readUInt16BE(i + 7), height: b.readUInt16BE(i + 5) }
    i += 2 + b.readUInt16BE(i + 2)
  }
  return null
}

export function readImageSize(bytes: Buffer): ImageSize | null {
  const size = pngSize(bytes) ?? webpSize(bytes) ?? jpegSize(bytes)
  return size && size.width > 0 && size.height > 0 ? size : null
}
