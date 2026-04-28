import { NextRequest } from 'next/server'

type OrderItem = { name: string; note: string | null; flaggedBy: string }

export async function POST(req: NextRequest) {
  const { shopName, supplierName, supplierEmail, items } = await req.json() as {
    shopName: string
    supplierName: string
    supplierEmail: string
    items: OrderItem[]
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return Response.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 })

  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
  const itemLines = items.map(i => `  • ${i.name}${i.note ? ` — "${i.note}"` : ''} (flagged by ${i.flaggedBy})`).join('\n')
  const itemHtml = items.map(i => `<li><strong>${i.name}</strong>${i.note ? ` — <em>${i.note}</em>` : ''} <span style="color:#999;font-size:12px">(${i.flaggedBy})</span></li>`).join('')

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: `Corner Orders <${fromEmail}>`,
      to: supplierEmail,
      subject: `Order Request — ${shopName}`,
      text: `Hi ${supplierName},\n\n${shopName} needs to reorder the following:\n\n${itemLines}\n\nPlease confirm when you can fulfill this order.\n\n— ${shopName} via Corner`,
      html: `
        <div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#1E1410">
          <p style="font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#8A9167;margin:0 0 24px">Corner · Order Request</p>
          <h2 style="font-weight:300;font-size:24px;margin:0 0 8px">${shopName}</h2>
          <p style="color:#8A9167;margin:0 0 24px;font-size:14px">Hi ${supplierName} — the following items need to be reordered:</p>
          <ul style="padding:0;margin:0 0 24px;list-style:none;border-left:3px solid #6B2737">
            ${itemHtml.split('<li>').join('<li style="padding:8px 0 8px 16px;border-bottom:1px solid #EAE0CE;font-size:14px">')}
          </ul>
          <p style="font-size:14px;color:#1E1410">Please confirm when you can fulfill this order.</p>
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
