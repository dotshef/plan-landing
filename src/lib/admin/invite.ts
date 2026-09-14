import 'server-only'
import { sendMail } from '@/lib/email/sender'

const LOGIN_URL = 'https://www.plankor.kr/admin/login'

// 임시 비밀번호는 이 메일 본문에만 평문으로 존재한다 — DB·로그에 남기지 않는다.
export async function sendInviteMail(to: string, tempPassword: string, isReissue = false): Promise<void> {
  const title = isReissue ? '임시 비밀번호가 재발급되었습니다' : '관리자로 초대되었습니다'
  const subject = `[투자그룹 플랜] ${title}`

  const text = [
    `투자그룹 플랜 관리자 사이트 — ${title}`,
    '',
    `로그인 페이지: ${LOGIN_URL}`,
    `이메일: ${to}`,
    `임시 비밀번호: ${tempPassword}`,
    '',
    '임시 비밀번호는 발급 후 7일간 유효합니다.',
    '최초 로그인 시 새 비밀번호를 설정해야 합니다.',
  ].join('\n')

  const html = `<!doctype html>
<html lang="ko">
  <body style="margin:0;padding:24px;background:#F2F4F6;font-family:'Apple SD Gothic Neo','Malgun Gothic',sans-serif;">
    <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:16px;padding:32px;">
      <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#1B6CF2;">투자그룹 플랜 관리자</p>
      <h1 style="margin:0 0 20px;font-size:20px;color:#191F28;">${title}</h1>
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #F2F4F6;font-size:13px;color:#8B95A1;">이메일</td>
          <td style="padding:12px 0;border-bottom:1px solid #F2F4F6;font-size:14px;font-weight:700;color:#191F28;text-align:right;">${to}</td>
        </tr>
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #F2F4F6;font-size:13px;color:#8B95A1;">임시 비밀번호</td>
          <td style="padding:12px 0;border-bottom:1px solid #F2F4F6;font-size:16px;font-weight:800;color:#1B6CF2;text-align:right;font-family:Consolas,monospace;letter-spacing:1px;">${tempPassword}</td>
        </tr>
      </table>
      <a href="${LOGIN_URL}" style="display:block;margin:24px 0 0;padding:14px 0;background:#1B6CF2;color:#fff;font-size:15px;font-weight:700;text-align:center;text-decoration:none;border-radius:10px;">관리자 로그인</a>
      <p style="margin:18px 0 0;font-size:12px;color:#8B95A1;line-height:1.7;">
        임시 비밀번호는 발급 후 7일간 유효합니다.<br>
        최초 로그인 시 새 비밀번호를 설정해야 합니다.
      </p>
    </div>
  </body>
</html>`

  await sendMail({ label: '플랜 관리자', subject, text, html, to })
}
