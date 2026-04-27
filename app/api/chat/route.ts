import Anthropic from '@anthropic-ai/sdk'
import { NextRequest } from 'next/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const { message, systemPrompt, menuContext } = await req.json()

  if (!message || !systemPrompt) {
    return new Response('Invalid request', { status: 400 })
  }

  const fullSystem = menuContext
    ? `${systemPrompt}\n\n---\nCurrent menu & offerings at this restaurant:\n${menuContext}`
    : systemPrompt

  const stream = client.messages.stream({
    model: 'claude-opus-4-7',
    max_tokens: 1024,
    thinking: { type: 'adaptive' },
    system: fullSystem,
    messages: [{ role: 'user', content: message }],
  })

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
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
