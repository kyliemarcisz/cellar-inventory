import Anthropic from '@anthropic-ai/sdk'
import { NextRequest } from 'next/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { message, messages, systemPrompt, inventoryContext, menuContext, documents } = body

  if (!systemPrompt) return new Response('Invalid request', { status: 400 })

  let knowledgeBlock = ''
  if (inventoryContext) knowledgeBlock += `\n\n${inventoryContext}`
  if (menuContext) knowledgeBlock += `\n\n--- Current Menu & Offerings ---\n${menuContext}`
  if (documents?.length) {
    for (const doc of documents as { name: string; content: string }[]) {
      knowledgeBlock += `\n\n--- ${doc.name} ---\n${doc.content}`
    }
  }

  const fullSystem = knowledgeBlock
    ? `${systemPrompt}\n\nYou have access to the following restaurant knowledge. Use it to give accurate, specific answers:\n${knowledgeBlock}`
    : systemPrompt

  // Multi-turn: use messages array. Single-turn: wrap message.
  const isMultiTurn = Array.isArray(messages) && messages.length > 0
  const apiMessages: { role: 'user' | 'assistant'; content: string }[] = isMultiTurn
    ? messages
    : [{ role: 'user', content: message }]

  if (!isMultiTurn && !message) return new Response('Invalid request', { status: 400 })

  const stream = client.messages.stream({
    model: isMultiTurn ? 'claude-haiku-4-5-20251001' : 'claude-opus-4-7',
    max_tokens: 1024,
    ...(isMultiTurn ? {} : { thinking: { type: 'adaptive' } }),
    system: fullSystem,
    messages: apiMessages,
  })

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            controller.enqueue(encoder.encode(event.delta.text))
          }
        }
      } finally {
        controller.close()
      }
    },
  })

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
