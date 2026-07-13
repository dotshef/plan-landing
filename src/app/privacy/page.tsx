import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '개인정보처리방침 — 투자그룹 플랜',
  description: '투자그룹 플랜의 개인정보처리방침입니다.',
  alternates: { canonical: '/privacy' },
}

// 원본(planinvest.kr/html/etc/privacy)의 폰트 크기/굵기 체계를 그대로 복제
// (원본 기준 1rem = 10px: 본문 16px/300/#666, 조항 제목 20px/600, 페이지 제목 54px/700)
const styles = `
.privacy-title {
  text-align: center;
  margin-top: 40px;
}
.privacy-title span {
  font-size: 20px;
  font-weight: 600;
  color: #448AFF;
}
.privacy-title h2 {
  font-size: 54px;
  font-weight: 700;
  color: #222;
  margin: 10px 0 0;
}
.privacy-wrap {
  max-width: 1140px;
  margin: 0 auto;
  padding: 60px 15px 120px;
}
.privacy-wrap .block_area {
  margin-bottom: 40px;
  font-size: 16px;
  font-weight: 300;
  color: #666;
  line-height: 1.6;
}
.privacy-wrap .block_area:last-child {
  margin-bottom: 0;
}
.privacy-wrap .block_area p {
  margin: 0;
}
.privacy-wrap .block_area .tit {
  display: block;
  margin-bottom: 10px;
  font-size: 20px;
  font-weight: 600;
  color: #000;
}
.privacy-wrap .block_area .tit2 {
  display: block;
  margin: 5px 0;
  font-weight: 600;
}
.privacy-wrap .block_area ol {
  padding: 0;
  margin: 0;
  list-style: none;
}
.privacy-wrap .block_area .dep1 {
  counter-reset: dep1;
}
.privacy-wrap .block_area .dep1 > li {
  position: relative;
  padding-left: 20px;
  margin-bottom: 5px;
}
.privacy-wrap .block_area .dep1 > li:before {
  content: counter(dep1) ". ";
  counter-increment: dep1;
  position: absolute;
  top: 0;
  left: 0;
}
.privacy-wrap .block_area .dep2 {
  margin: 5px 0;
  counter-reset: dep2;
}
.privacy-wrap .block_area .dep2 > li {
  position: relative;
  padding-left: 20px;
  margin-bottom: 5px;
}
.privacy-wrap .block_area .dep2 > li:before {
  content: counter(dep2) ") ";
  counter-increment: dep2;
  position: absolute;
  top: 0;
  left: 0;
}
.privacy-wrap .block_area .dep1 > li:last-child,
.privacy-wrap .block_area .dep2 > li:last-child {
  margin-bottom: 0;
}
.privacy-wrap .block_area .table_area table {
  margin: 10px 0;
  width: 100%;
  border-collapse: collapse;
  border-top: 2px solid #000;
  border-left: 1px solid #ddd;
}
.privacy-wrap .block_area .table_area th,
.privacy-wrap .block_area .table_area td {
  padding: 15px;
  text-align: center;
  border-right: 1px solid #ddd;
  border-bottom: 1px solid #ddd;
}
.privacy-wrap .block_area .table_area th {
  background: #f7f7f7;
  font-weight: 700;
}
@media (max-width: 991.98px) {
  .privacy-title { margin-top: 20px; }
  .privacy-title span { font-size: 14px; }
  .privacy-title h2 { font-size: 32px; }
  .privacy-wrap { padding: 40px 15px 60px; }
  .privacy-wrap .block_area { margin-bottom: 30px; }
}
`

export default function PrivacyPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />

      <div className="privacy-title">
        <span>Privacy</span>
        <h2>개인정보취급방침</h2>
      </div>

      <div className="privacy-wrap">
        <div className="block_area">
          <p>
            투자그룹 플랜(이하 &lsquo;회사&rsquo;라고 함)는 통신비밀보호법, 전기통신사업법, 정보통신망 이용촉진 및 정보보호 등에 관한 법률 등
            정보통신서비스 제공자가 준수하여야 할 관련 법령상의 개인정보보호 규정을 준수하며, 관련 법령에 의거한 개인정보처리방침을 정하여
            이용자 권익 보호에 최선을 다하고 있습니다.<br />
            본 개인정보처리방침은 개인정보보호와 관련한 법령 또는 지침의 변경 및 회사 정책의 변화에 따라 변경될 수 있으니
            이용자께서는 당사 사이트를 방문 시 수시로 확인 바랍니다.<br />
            <br />
            회사의 개인정보처리방침은 다음과 같습니다.
          </p>
        </div>

        <div className="block_area">
          <strong className="tit">1. 개인정보처리방침 용어의 정의</strong>
          <ol className="dep1">
            <li>
              &quot;개인정보&quot;라 함은 개인에 관한 정보로서 성명/주민등록번호 등에 의하여 특정한 개인을 알아볼 수 있는
              부호/문자/음성/음향 및 영상 등의 정보(해당 정보만으로는 특정 개인을 알아볼 수 없어도 다른 정보와 쉽게 결합하여
              알아볼 수 있는 경우는 그 정보를 포함)를 말합니다.
            </li>
            <li>
              &quot;이용자&quot;라 함은 투자그룹 플랜의 웹사이트(www.plankor.kr)에 접속하여 이 약관에 따라 회사가 제공하는
              서비스를 받는 자를 말합니다.
            </li>
          </ol>
        </div>

        <div className="block_area">
          <strong className="tit">2. 개인정보 수집에 대한 동의</strong>
          <p>
            회사는 이용자가 회사의 개인정보처리방침 또는 이용약관의 내용에 대해 &quot;동의함&quot; 버튼 또는
            &quot;동의하지 않음&quot; 버튼을 클릭할 수 있는 절차를 마련하였습니다.<br />
            이에 이용자가 동의의 의사표시가 있는 경우 개인정보의 수집에 동의한 것으로 봅니다.
          </p>
        </div>

        <div className="block_area">
          <strong className="tit">3. 수집하는 개인정보의 항목 및 수집방법</strong>
          <ol className="dep1">
            <li>
              수집하는 개인정보의 항목은 원활한 고객상담, 각종 서비스의 제공을 위해 아래와 같은 개인정보를 수집하고 있습니다.
              <strong className="tit2">[온라인 문의, 뉴스레터, 무료 리포트 수집항목]</strong>
              <ol className="dep2">
                <li>온라인 문의, 답변, 고객상담 : 이름, 이메일, 휴대전화번호</li>
                <li>뉴스레터 신청, 발송 : 이름, 이메일</li>
                <li>무료 리포트 신청 : 이름, 휴대전화번호, 관심 종목, 유입 광고 매체, 광고 키워드</li>
                <li>IP adress : 쿠키, 방문 일시, 서비스 이용 기록</li>
              </ol>
            </li>
            <li>
              개인정보 수집방법<br />
              회사는 다음과 같은 방법으로 개인정보를 수집합니다.
              <ol className="dep2">
                <li>홈페이지 상담 게시판 및 무료 리포트 신청 양식, 전화, 전자우편</li>
              </ol>
            </li>
          </ol>
        </div>

        <div className="block_area">
          <strong className="tit">4. 아동의 개인정보보호</strong>
          <ol className="dep1">
            <li>회사는 만14세 미만 아동의 개인정보를 수집하는 경우 법정대리인의 동의를 받습니다.</li>
            <li>
              14세 미만 아동의 법정대리인은 아동의 개인정보의 열람, 정정, 동의철회를 요청할 수 있으며,
              이러한 요청이 있을 경우 회사는 지체없이 필요한 조치를 취합니다.
            </li>
          </ol>
        </div>

        <div className="block_area">
          <strong className="tit">5. 개인정보의 수집 및 이용목적</strong>
          <ol className="dep1">
            <li>
              서비스 제공
              <ol className="dep2">
                <li>이용자 대상으로 제공되는 각종 콘텐츠 이용 및 상담 문의</li>
                <li>불만처리 등 민원처리, 고지사항 전달</li>
              </ol>
            </li>
            <li>
              신규 서비스 개발 및 마케팅/광고에 활용
              <ol className="dep2">
                <li>이벤트 등 광고성 정보 전달, 이벤트 당첨 시 물품배송</li>
                <li>신규 서비스 개발 및 특화, 인구통계학적 특성에 따른 서비스 제공 및 광고 게재</li>
                <li>접속 빈도 파악 또는 이용자의 서비스 이용에 대한 통계</li>
                <li>광고 유입경로 및 광고 성과 확인</li>
              </ol>
            </li>
          </ol>
        </div>

        <div className="block_area">
          <strong className="tit">6. 개인정보의 보유 및 이용기간</strong>
          <p>
            회사는 이용자께서 서비스를 제공하는 기간 동안에 한하여 이용자의 개인정보를 보유 및 이용하게 됩니다.<br />
            개인정보의 수집 및 이용에 대한 동의를 철회하는 경우, 수집/이용목적을 달성하거나 보유/이용기간이 종료된 경우,
            사업폐지 등의 사유발생시 당해 개인정보를 지체 없이 파기합니다.<br />
            단, 다음의 정보에 대해서는 아래의 이유로 명시한 기간 동안 보존합니다.
          </p>
          <ol className="dep1">
            <li>무료 리포트 신청 정보: 동의일로부터 1년</li>
            <li>
              전자상거래 등에서 소비자 보호에 관한 법률
              <ol className="dep2">
                <li>문의접수 시 기재한 개인 정보 및 상담내용: 3년 보관</li>
                <li>소비자의 불만 또는 분쟁처리에 관한 기록: 3년 보관</li>
              </ol>
            </li>
          </ol>
        </div>

        <div className="block_area">
          <strong className="tit">7. 개인정보 파기절차 및 그 방법</strong>
          <p>
            회사는 원칙적으로 수집한 개인정보의 이용목적이 달성되면 보관기간 및 이용기간에 따라 해당정보를 지체없이 파기합니다.<br />
            회사의 개인정보 파기절차 및 방법은 다음과 같습니다.
          </p>
          <ol className="dep1">
            <li>
              파기절차
              <ol className="dep2">
                <li>
                  사이트 이용을 위해 입력한 정보는 이용 목적이 달성된 후 내부 방침 및 기타 관련 법령에 의한 정보 보호 사유에
                  따라(보유 및 이용기간 참조) 일정 기간 저장된 후 삭제되거나 파기됩니다.
                </li>
              </ol>
            </li>
            <li>
              파기방법
              <ol className="dep2">
                <li>
                  전자적 파일 형태로 저장된 개인정보는 기록을 재생할 수 없는 기술적 방법을 사용하여 삭제합니다.<br />
                  종이에 출력된 개인정보는 분쇄기로 분쇄하거나 소각을 통하여 파기합니다.
                </li>
              </ol>
            </li>
          </ol>
        </div>

        <div className="block_area">
          <strong className="tit">8. 개인정보의 제 3자 제공 및 공유</strong>
          <p>
            회사는 이용자의 개인정보를 제 4조에서 고지한 범위 내에서 사용하며 이용자의 사전 동의 없이는 동 범위를 초과하여
            이용하거나 원칙적으로 이용자의 개인정보를 외부에 제공하지 않습니다.
          </p>
          <strong className="tit2">[제 3자 제공]</strong>
          <p>
            보다 나은 서비스 제공을 위하여 이용자님의 개인정보를 제 3자에 제공하거나 공유할 수 있습니다. 개인정보를 제공하거나
            공유할 경우에는 사전에 제공 또는 공유 받는 자가 누구 인지, 제공 또는 공유되는 개인정보항목이 무엇인지, 왜 그러한
            정보가 제공 또는 공유되어야 하는지, 그리고 언제까지 어떻게 보호관리 되는지에 대해 개별적으로 전자우편 및 서면을 통해
            고지하여 동의를 구하는 절차를 거치거나, 문의접수시 약관을 통하여 동의를 구할 수도 있습니다. 이용자님께서 동의하지
            않은 경우에는 제 3자에게 제공하거나 공유하지 않습니다. 제 3자 제공 및 공유 관계에 변화가 있거나 관계가 종결될 때도
            같은 절차에 의하여 고지하거나 동의를 구합니다.<br />
            <br />
            다만, 아래의 경우에는 예외로 합니다.
          </p>
          <ol className="dep1">
            <li>이용자가 사전에 개인정보 공개에 동의한 경우</li>
            <li>법령 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
          </ol>
        </div>

        <div className="block_area">
          <strong className="tit">9. 개인정보의 처리위탁</strong>
          <p>
            회사는 서비스 향상을 위해 아래와 같이 개인정보를 위탁하고 있으며, 관계법령에 따라 위탁계약 시 개인정보가 안전하게
            관리될 수 있도록 규정하고 있습니다.
          </p>
          <div className="table_area">
            <table>
              <colgroup>
                <col width="50%" />
                <col width="50%" />
              </colgroup>
              <thead>
                <tr>
                  <th scope="col">수탁업체</th>
                  <th scope="col">위탁업무 내용</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>홈페이지제작전문</td>
                  <td>홈페이지 관리 운영</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            위탁계약 체결 시 개인정보 보호법 제26조에 따라 위탁업무 수행목적 외 개인정보 처리금지, 기술적∙관리적 보호조치,
            재위탁 제한, 수탁자에 대한 관리∙감독, 손해배상 등 책임에 관한 사항을 계약서 등 문서에 명시하고, 수탁자가 개인정보를
            안전하게 처리하는지를 감독하고 있습니다.<br />
            <br />
            위탁업무의 내용이나 수탁자가 변경될 경우에는 지체없이 본 개인정보 처리방침을 통하여 공개하도록 하겠습니다.
          </p>
        </div>

        <div className="block_area">
          <strong className="tit">10. 이용자 권리와 그 행사방법</strong>
          <ol className="dep1">
            <li>이용자는 언제든지 등록되어 있는 자신의 개인정보를 조회하거나 수정할 수 있으며, 삭제를 요청할 수 있습니다.</li>
            <li>
              이용자의 개인정보 조회, 수정을 위해서는 &quot;정보수정&quot;을, 가입 해지(동의철회)를 위해서는
              개인정보관리책임자에게 서면, 전화 또는 전자우편을 통한 처리가 가능합니다.
            </li>
            <li>
              이용자가 개인정보의 오류에 대한 정정을 요청하신 경우에는 최대한 빨리 정정이 이루어지도록 합니다.<br />
              또한 잘못된 개인정보를 제3자에게 이미 제공한 경우에는 정정 처리결과를 제3자에게 지체 없이 통지하여 정정이
              이루어지도록 합니다.
            </li>
            <li>
              회사는 이용자의 요청에 의해 해지 또는 삭제된 개인정보는 &quot;6. 개인정보의 보유 및 이용기간&quot;에 명시된 바에
              따라 처리하고, 그 외의 용도로 열람 또는 이용할 수 없도록 처리하고 있습니다.
            </li>
          </ol>
        </div>

        <div className="block_area">
          <strong className="tit">11. 쿠키(cookie)의 설치/운영 및 거부에 관한 사항</strong>
          <p>
            쿠키(cookie)는 웹 사이트 서버가 이용자의 컴퓨터로 전송하는 소량의 정보이며, 여기에는 방문한 웹 사이트의 정보 및
            서비스 제공 시 확인에 필요한 이용자의 개인정보 등이 담겨 있습니다. 이용자는 쿠키의 수신을 거부하거나 쿠키의 수신에
            대하여 경고하도록 사용하는 컴퓨터의 웹 브라우저 설정을 변경할 수 있습니다. 회사는 다음과 같이 웹 서비스 이용에 있어
            필요하다고 판단되는 경우 이용자의 컴퓨터에 쿠키를 전송할 수 있습니다.
          </p>
          <ol className="dep1">
            <li>
              쿠키의 사용 목적 개인의 관심 분야에 따라 차별화된 정보를 제공, 이용자의 접속빈도 또는 이용 시간 등을 분석하여
              이용자의 취향과 관심 분야를 파악하여 타겟(target) 마케팅에 활용, 관심 있게 둘러본 정보들에 대해 자취를 추적하여
              개인 맞춤 서비스를 제공, 이용자들의 습관을 분석하여 서비스 개편 등을 고려하는 척도, 게시판 글 등록으로 수집되어
              사용될 수 있습니다.
            </li>
            <li>
              쿠키의 설치/운영 및 거부
              <ol className="dep2">
                <li>
                  이용자는 쿠키 설치에 대한 선택권을 가지고 있으며, 웹 브라우저에서 옵션을 설정함으로써 모든 쿠키를 허용하거나,
                  쿠키가 저장될 때마다 확인을 거치거나 모든 쿠키의 저장을 거부할 수도 있습니다.
                </li>
                <li>다만, 쿠키의 저장을 거부할 경우에는 회사의 일부 서비스는 이용에 어려움이 있을 수 있습니다.</li>
                <li>
                  쿠키설정 방법<br />
                  파이어폭스: https://support.mozilla.com/ko/kb/disable-third-party-cookies<br />
                  크롬: https://support.google.com/chrome/answer/95647?hl=ko&amp;topic=14666&amp;ctx=topic<br />
                  인터넷 익스플로어: https://support.microsoft.com/ko-kr/help/17442<br />
                  사파리: https://support.apple.com/ko-kr/guide/safari/sfri11471/mac
                </li>
              </ol>
            </li>
          </ol>
        </div>

        <div className="block_area">
          <strong className="tit">12. 개인정보의 기술적/관리적 보호 대책</strong>
          <p>
            회사는 이용자들의 개인정보를 처리함에 있어 개인정보가 분실, 도난, 누출, 변조 또는 훼손되지 않도록 안전성 확보를
            위하여 다음과 같은 기술적, 관리적 대책을 강구하고 있습니다.
          </p>
          <ol className="dep1">
            <li>
              기술적 대책
              <ol className="dep2">
                <li>
                  이용자들의 개인정보는 철저히 보호되고 있습니다. 이용자는 개인정보를 누구에게도 알려주시면 안 됩니다.<br />
                  이를 위해 회사에서는 기본적으로 PC에서의 사용을 마치신 후 온라인상에서 웹브라우저를 종료하도록 권장합니다.
                  특히 다른 사람과 PC를 공유하여 사용하거나 공공장소(회사나 학교, 도서관, 인터넷게임방 등)에서 이용한 경우에는
                  개인정보가 다른 사람에게 알려지는 것을 막기 위해 위와 같은 절차가 더욱 필요할 것입니다.
                </li>
                <li>
                  회사는 백신프로그램을 이용하여 해킹이나 컴퓨터 바이러스 등에 의해 이용자의 개인정보가 유출되거나 훼손되는
                  피해를 방지하기 위한 조치를 취하고 있습니다.<br />
                  개인정보의 훼손에 대비해서 자료를 수시로 백업하고 있고, 최신 백신프로그램을 이용하여 이용자의 개인정보나
                  자료가 누출되거나 손상되지 않도록 방지하고 있으며, 암호화 통신 등을 통하여 네트워크상에서 개인정보를 안전하게
                  전송할 수 있도록 하고 있습니다. 그리고 침입차단시스템을 이용하여 외부로부터의 무단 접근을 통제하고 있으며,
                  기타 시스템적으로 보안성을 확보하기 위한 가능한 모든 기술적 장치를 갖추려 노력하고 있습니다.
                </li>
              </ol>
            </li>
            <li>
              관리적 대책
              <ol className="dep2">
                <li>
                  회사는 이용자들의 개인정보의 안전한 보호를 위하여 개인정보관련 처리 직원을 담당자에게 한정시키고 있고 이를
                  위한 별도의 비밀번호를 부여하여 정기적으로 갱신하고 있으며, 담당자에 대해 새로운 보안 기술 습득과 개인 정보
                  보호의무 등에 대한 수시 교육을 통하여 회사의 개인정보 처리방침의 준수를 항상 강조하고 있습니다.
                </li>
                <li>
                  단, 이용자 본인의 부주의나 인터넷상의 문제로 개인정보가 유출해 발생한 문제에 대해 회사는 일체의 책임을 지지
                  않습니다.
                </li>
              </ol>
            </li>
          </ol>
        </div>

        <div className="block_area">
          <strong className="tit">13. 개인정보관리책임자 및 담당자의 연락처</strong>
          <p>
            이용자는 회사의 서비스를 이용하시면 발생하는 모든 개인정보보호 관련 민원을 개인정보관리책임자 혹은 담당부서로
            신고하실 수 있습니다.<br />
            이용자가 개인정보를 처리하는 책임자 및 담당자는 개인정보 관련 문의사항에 신속하고 성실하게 답변을 드릴 것입니다.
          </p>
          <strong className="tit2">개인정보 관리 책임자</strong>
          <p>
            이 름 : 관리자<br />
            소 속 : 보안사업본부<br />
            직 위 : 본부장<br />
            연락처 : admin@plankor.kr
          </p>
        </div>

        <div className="block_area">
          <strong className="tit">14. 정보주체의 권익 침해에 대한 구제방법</strong>
          <p>
            개인정보침해에 대한 신고 또는 상담이 필요하신 경우에는 한국정보보호진흥원(KISA) 개인정보침해신고센터로 문의하시기
            바랍니다. 또한, 귀하가 개인정보침해를 통한 금전적, 정신적 피해를 입으신 경우에는 한국정보보호진흥원(KISA)
            개인정보분쟁조정위원회에 피해구제를 신청하실 수 있습니다.<br />
            <br />
            개인정보 침해신고센터 (http://www.cyberprivacy.or.kr, 전화 1336)<br />
            개인정보 분쟁조정위원회 (http://www.kopico.or.kr, 전화 1336)<br />
            정보보호마크 인증위원회 (http://www.privacymark.or.kr, 전화 02-580-0533)<br />
            대검찰청 인터넷범죄수사센터 (http://www.spo.go.kr, 전화 02-3480-3600)<br />
            경찰청 사이버테러대응센터 (http://www.ctrc.go.kr, 전화 02-392-0330)<br />
            경찰청 (http://www.police.go.kr)
          </p>
        </div>

        <div className="block_area">
          <strong className="tit">15. 개인정보처리방침의 변경에 관한 고지의 의무</strong>
          <p>
            본 개인정보처리방침 내용의 추가, 삭제 및 수정이 있을 경우 개정 최소 7일전에 &#39;공지사항&#39;을 통해 사전 공지를 할
            것입니다. 다만, 수집하는 개인정보의 항목, 이용목적의 변경 등과 같이 정보주체 권리의 중대한 변경이 발생할 때에는
            최소 30일 전에 공지하며, 필요 시 정보 주체 동의를 다시 받을 수도 있습니다<br />
            <br />
            공고일자 : 2021년 7월 1일<br />
            시행일자 : 2021년 7월 1일
          </p>
        </div>
      </div>
    </>
  )
}
