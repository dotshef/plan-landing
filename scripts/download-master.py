# -*- coding: utf-8 -*-
"""
KIS 종목마스터 파일 다운로드 + 파싱
- kospi_code.mst / kosdaq_code.mst (KIS 공식 배포, cp949 고정폭 포맷)
- 출처: https://github.com/koreainvestment/open-trading-api (stocks_info 샘플)
- 실행: python scripts/download-master.py
- 출력: scripts/master-kospi.csv, scripts/master-kosdaq.csv, 콘솔에 그룹별 통계
"""
import csv
import io
import os
import urllib.request
import zipfile
from collections import Counter

BASE = 'https://new.real.download.dws.co.kr/common/master'
OUT_DIR = os.path.dirname(os.path.abspath(__file__))

# 뒷부분 고정폭 길이 (개행 제외): kospi 227자, kosdaq 221자
# KIS 공식 파서는 개행 포함 row에서 -228/-222로 슬라이스함
TAIL = {'kospi': 227, 'kosdaq': 221}

GROUP_NAMES = {
    'ST': '주권(보통주/우선주)',
    'MF': '증권투자회사',
    'RT': '리츠',
    'SC': '선박투자회사',
    'IF': '사회간접자본투융자회사',
    'DR': '주식예탁증서(DR)',
    'EW': 'ELW',
    'EF': 'ETF',
    'EN': 'ETN',
    'SW': '신주인수권증권',
    'SR': '신주인수권증서',
    'BC': '수익증권',
    'FE': '해외ETF',
    'FS': '외국주권',
}


def download(market: str) -> bytes:
    url = f'{BASE}/{market}_code.mst.zip'
    print(f'다운로드: {url}')
    with urllib.request.urlopen(url, timeout=30) as res:
        zdata = res.read()
    with zipfile.ZipFile(io.BytesIO(zdata)) as zf:
        name = zf.namelist()[0]
        return zf.read(name)


def parse(market: str, raw: bytes):
    tail = TAIL[market]
    rows = []
    for line in raw.splitlines():
        if not line.strip():
            continue
        text = line.decode('cp949', errors='replace')
        head, back = text[:-tail], text[-tail:]
        code = head[0:9].rstrip()        # 단축코드
        std_code = head[9:21].rstrip()   # 표준코드 (ISIN)
        name = head[21:].strip()         # 한글 종목명
        group = back[0:2]                # 증권그룹코드 (ST=주권, EF=ETF, ...)
        rows.append({'code': code, 'std_code': std_code, 'name': name, 'group': group})
    return rows


def main():
    summary = {}
    for market in ('kospi', 'kosdaq'):
        raw = download(market)
        rows = parse(market, raw)
        groups = Counter(r['group'] for r in rows)
        stocks = [r for r in rows if r['group'] == 'ST']

        out = os.path.join(OUT_DIR, f'master-{market}.csv')
        with open(out, 'w', newline='', encoding='utf-8-sig') as f:
            w = csv.DictWriter(f, fieldnames=['code', 'std_code', 'name', 'group'])
            w.writeheader()
            w.writerows(rows)

        print(f'\n=== {market.upper()} ===')
        print(f'전체 레코드: {len(rows)}')
        print(f'주권(ST, 상장사 종목): {len(stocks)}')
        for g, cnt in groups.most_common():
            print(f'  {g} {GROUP_NAMES.get(g, "?"):24s}: {cnt}')
        print(f'저장: {out}')
        summary[market] = (len(rows), len(stocks))

    print('\n=== 요약 ===')
    for market, (total, st) in summary.items():
        print(f'{market.upper():6s} 전체 {total}종목 / 주권 {st}종목')


if __name__ == '__main__':
    main()
