import Anthropic from '@anthropic-ai/sdk'
import { NextRequest } from 'next/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const { menuText, pdfBase64, shopName, venueType, existingCategories } = await req.json()

  if (!menuText?.trim() && !pdfBase64) {
    return Response.json({ error: 'No menu content provided' }, { status: 400 })
  }

  const existingCatList = (existingCategories as string[])?.join(', ') || 'none'

  const instructions = `You are helping set up inventory tracking for "${shopName}", a ${venueType}.

Extract every trackable inventory item from this menu.

For each item determine:
- can_order: true if it's a purchased product that needs restocking (bottles, produce, dairy, packaging, etc.)
- can_make: true if it's prepared in-house (cocktails, dishes, baked goods, etc.)
- is_weekly: true if it's a high-turnover staple needing weekly restocking
- An item can have both can_order and can_make true (e.g. a cocktail whose base spirit also needs ordering)

Existing inventory categories: ${existingCatList}
Fit items into existing categories where logical. Create new categories only when clearly needed.
Group sensibly — don't fragment into too many categories.

Return ONLY valid JSON, no markdown, no explanation:
{
  "categories": [
    {
      "name": "Category Name",
      "isNew": true,
      "items": [
        { "name": "Item Name", "can_order": true, "can_make": false, "is_weekly": false }
      ]
    }
  ],
  "summary": "One sentence describing what was found"
}`

  try {
    let messageContent: Anthropic.MessageParam['content']

    if (pdfBase64) {
      messageContent = [
        {
          type: 'document',
          source: {
            type: 'base64',
            media_type: 'application/pdf',
            data: pdfBase64,
          },
        } as Anthropic.DocumentBlockParam,
        { type: 'text', text: instructions },
      ]
    } else {
      messageContent = `${instructions}\n\nMenu:\n${menuText.trim()}`
    }

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [{ role: 'user', content: messageContent }],
    })

    const raw = (message.content[0] as { type: string; text: string }).text.trim()
    const jsonStart = raw.indexOf('{')
    const jsonEnd = raw.lastIndexOf('}')
    const parsed = JSON.parse(raw.slice(jsonStart, jsonEnd + 1))

    return Response.json(parsed)
  } catch (err) {
    console.error('parse-menu error', err)
    return Response.json({ error: 'Failed to parse menu' }, { status: 500 })
  }
}
