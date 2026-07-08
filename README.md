This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Environment Variables

무료 리포트 신청 메일 발송에는 아래 서버 환경변수가 필요합니다.

```bash
RESEND_API_KEY=your_resend_api_key
EMAIL_TO=manager@example.com
GOOGLE_SHEET_WEBHOOK_URL=https://script.google.com/macros/s/your-deployment-id/exec
GOOGLE_SHEET_WEBHOOK_SECRET=your-long-random-secret
```

발신자는 코드에서 `no-reply@dotshef.com`으로 고정되어 있습니다.

## Google Apps Script Webhook

Google Sheet에는 아래 순서로 행을 추가합니다.

```txt
신청일시(KST) | 이름 | 연락처 | 관심종목 | 신청일시(ISO)
```

Apps Script 예시:

```js
const SECRET = 'your-long-random-secret'

function doPost(e) {
  const body = JSON.parse(e.postData.contents)

  if (body.secret !== SECRET) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false }))
      .setMimeType(ContentService.MimeType.JSON)
  }

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Sheet1')

  sheet.appendRow([
    body.requestedAtKst || body.requestedAt || new Date(),
    body.name || '',
    body.phone || '',
    body.stock || '',
    body.requestedAtIso || '',
  ])

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON)
}
```

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
