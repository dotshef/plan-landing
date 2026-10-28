import Image from 'next/image'

// 월계수 금화 번호 이미지(public/images/numbers/number01~03.png). 크기는 className 으로 정한다.
export default function GoldCoin({ no, className }: { no: string; className?: string }) {
  return (
    <span className={className} style={{ position: 'relative', flex: 'none', display: 'block' }}>
      <Image src={`/images/numbers/number${no}.png`} alt="" aria-hidden fill sizes="80px" style={{ objectFit: 'contain' }} />
    </span>
  )
}
