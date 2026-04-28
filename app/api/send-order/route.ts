import { NextRequest } from 'next/server'

type OrderItem = { name: string; note: string | null; flaggedBy: string }

export async function POST(req: NextRequest) {
  const { shopName, supplierName, supplierEmail, items, emailBody, confirmUrl } = await req.json() as {
    shopName: string
    supplierName: string
    supplierEmail: string
    items: OrderItem[]
    emailBody?: string
    confirmUrl?: string
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return Response.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 })

  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
  const itemHtml = items.map(i => `<li><strong>${i.name}</strong>${i.note ? ` — <em>${i.note}</em>` : ''}</li>`).join('')

  const confirmLine = confirmUrl ? `\n\nConfirm this order: ${confirmUrl}` : ''
  const textBody = (emailBody || `Hi ${supplierName},\n\n${shopName} needs to reorder the following:\n\n${items.map(i => `  • ${i.name}${i.note ? ` — "${i.note}"` : ''}`).join('\n')}\n\nPlease confirm when you can fulfill this order.\n\n— ${shopName} via Corner`) + confirmLine

  const htmlEmailBody = emailBody
    ? emailBody.replace(/\n/g, '<br>').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/&lt;br&gt;/g, '<br>')
    : `Hi ${supplierName} — the following items need to be reordered:`

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: `Corner Orders <${fromEmail}>`,
      to: supplierEmail,
      subject: `Order Request — ${shopName}`,
      text: textBody,
      html: `
        <div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#1E1410">
          <p style="font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#8A9167;margin:0 0 24px">Corner · Order Request</p>
          <p style="font-size:14px;color:#1E1410;margin:0 0 20px;line-height:1.6">${htmlEmailBody}</p>
          <ul style="padding:0;margin:0 0 24px;list-style:none;border-left:3px solid #6B2737">
            ${itemHtml.split('<li>').join('<li style="padding:8px 0 8px 16px;border-bottom:1px solid #EAE0CE;font-size:14px">')}
          </ul>
          ${confirmUrl ? `<a href="${confirmUrl}" style="display:block;margin-top:24px;padding:14px 20px;background:#6B2737;color:#FAF8F4;text-decoration:none;text-align:center;font-family:DM Sans,sans-serif;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;border-radius:4px">Confirm this order →</a>` : ''}
          <p style="font-size:11px;color:#C4A882;margin-top:32px;border-top:1px solid #EAE0CE;padding-top:16px">Sent via <strong>Corner</strong> · back-of-house intelligence</p>
        </div>`,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('Resend error', err)
    return Response.json({ error: 'Failed to send email' }, { status: 500 })
  }

  return Response.json({ ok: true })
}
