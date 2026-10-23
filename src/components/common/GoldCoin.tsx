// 아래쪽에 드러나는 금화 두께와 옆면 홈.
const COIN_REEDS = Array.from({ length: 49 }, (_, i) => {
  const a = Math.PI / 2 + (i * Math.PI) / 48
  return { x: 50 + 45.5 * Math.sin(a), y: 47 - 45.5 * Math.cos(a) }
})

const COIN_LEAVES = Array.from({ length: 8 }, (_, i) => {
  const a = ((20 + i * 15) * Math.PI) / 180
  return { x: 31 * Math.sin(a), y: 47 + 31 * Math.cos(a), angle: i * 15 - 35 }
})

// 둥근 주화 테두리, 홈이 있는 옆면, 월계수와 금색 양각 번호.
// idPrefix는 한 페이지에 여러 개를 그릴 때 그라데이션 id가 겹치지 않게 하는 용도.
export default function GoldCoin({ no, idPrefix, className }: { no: string; idPrefix: string; className?: string }) {
  const id = (k: string) => `${idPrefix}${k}`
  return (
    <svg className={className} viewBox="0 0 112 112" aria-hidden
      style={{ flex: 'none', overflow: 'visible', filter: 'drop-shadow(1px 4px 3px rgba(110,72,8,.24))' }}>
      <defs>
        <linearGradient id={id('Edge')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#8C5908" /><stop offset=".16" stopColor="#E9B51C" /><stop offset=".33" stopColor="#FFF087" /><stop offset=".5" stopColor="#B57C08" /><stop offset=".72" stopColor="#F8D647" /><stop offset=".9" stopColor="#98600A" /><stop offset="1" stopColor="#EBC33C" />
        </linearGradient>
        <linearGradient id={id('Rim')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFF7A1" /><stop offset=".16" stopColor="#F8D53F" /><stop offset=".3" stopColor="#B77A08" /><stop offset=".43" stopColor="#FFF59A" /><stop offset=".6" stopColor="#E6B020" /><stop offset=".74" stopColor="#94600C" /><stop offset=".88" stopColor="#FFE57E" /><stop offset="1" stopColor="#C68A12" />
        </linearGradient>
        <linearGradient id={id('Face')} x1="0" y1="0" x2=".85" y2="1">
          <stop offset="0" stopColor="#FFF19A" /><stop offset=".25" stopColor="#F4D239" /><stop offset=".48" stopColor="#E3B51E" /><stop offset=".72" stopColor="#FFE76B" /><stop offset="1" stopColor="#D4A015" />
        </linearGradient>
        <linearGradient id={id('Relief')} x1="0" y1="0" x2=".6" y2="1">
          <stop offset="0" stopColor="#FFF6AD" /><stop offset=".45" stopColor="#FCE578" /><stop offset="1" stopColor="#C18A0B" />
        </linearGradient>
      </defs>
      <g transform="translate(6 9) rotate(-10 50 50) scale(1 .9)">
        <circle cx="50" cy="54" r="46" fill={`url(#${id('Edge')})`} stroke="#9A690C" strokeWidth=".8" />
        <g stroke="#80520B" strokeWidth=".65" opacity=".7">
          {COIN_REEDS.map(({ x, y }, i) => <line key={i} x1={x} y1={y} x2={x} y2={y + 7} />)}
        </g>
        <path d="M4 55 A46 46 0 0 0 96 55" fill="none" stroke="#FFE477" strokeWidth=".8" />
        <circle cx="50" cy="47" r="46" fill={`url(#${id('Rim')})`} stroke="#C28D0C" strokeWidth=".7" />
        <circle cx="50" cy="47" r="43.8" fill="none" stroke="#FFF4A3" strokeWidth="1" />
        <circle cx="50" cy="47" r="41.8" fill={`url(#${id('Face')})`} stroke="#AE7A09" strokeWidth=".8" />
        <circle cx="50" cy="47" r="39.3" fill="none" stroke="#FFF18F" strokeWidth=".75" />
        <circle cx="50" cy="47" r="37.6" fill="none" stroke="#AD7C0A" strokeWidth=".65" strokeDasharray=".5 2.4" />
        <g fill="none" stroke="#AD7C0A" strokeWidth=".85">
          <path d="M46 78 C21 68 17 42 29 24 M54 78 C79 68 83 42 71 24" />
          <path d="M43 78 Q50 74 57 78" />
        </g>
        {COIN_LEAVES.flatMap(({ x, y, angle }, i) => [-1, 1].map((side) => (
          <ellipse key={`${i}-${side}`} cx={50 + side * x} cy={y} rx="1.8" ry="4.1"
            transform={`rotate(${-side * angle} ${50 + side * x} ${y})`}
            fill={`url(#${id('Relief')})`} stroke="#B1820E" strokeWidth=".55" />
        )))}
        <circle cx="50" cy="47" r="22" fill="none" stroke="#AE7A09" strokeWidth=".65" />
        <circle cx="50" cy="46.4" r="21.4" fill="none" stroke="#FFF099" strokeWidth=".65" />
        <g textAnchor="middle" fontFamily="Georgia, 'Times New Roman', serif" fontSize="31" fontWeight="700" letterSpacing="-1.5">
          <text x="50.7" y="59.5" fill="#A7770A" stroke="#A7770A" strokeWidth=".7">{no}</text>
          <text x="49.6" y="58.1" fill="#FFF6AC">{no}</text>
          <text x="50" y="58.6" fill={`url(#${id('Relief')})`}>{no}</text>
        </g>
        <path d="M15 26 A41 41 0 0 1 63 8" fill="none" stroke="#FFF9C0" strokeWidth="1.4" strokeLinecap="round" opacity=".8" />
      </g>
    </svg>
  )
}
