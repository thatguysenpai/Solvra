import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const GROQ_BASE_URL = process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1';
const DEFAULT_MODEL = 'openai/gpt-oss-120b';

/** Keep requests inside the model's context window on very long chats. */
const MAX_HISTORY = 40;

const SYSTEM_PROMPT = `You are Solvra, a helpful, knowledgeable and honest general-purpose AI assistant.
Answer directly and accurately. Prefer clear, dense prose; use Markdown (lists, tables, fenced code blocks with a language tag) only when it genuinely helps.
If you are unsure or lack information, say so instead of guessing.`;

type Role = 'user' | 'assistant';
interface ApiMessage {
  role: Role;
  content: string;
}

const errorResponse = (status: number, error: string, details?: string) =>
  NextResponse.json(details ? { error, details } : { error }, { status });

/** Accepts only well-formed { role, content } pairs; drops anything else. */
function sanitizeMessages(input: unknown): ApiMessage[] | null {
  if (!Array.isArray(input)) return null;
  const out: ApiMessage[] = [];
  for (const m of input) {
    if (!m || typeof m !== 'object') continue;
    const { role, content } = m as { role?: unknown; content?: unknown };
    if ((role === 'user' || role === 'assistant') && typeof content === 'string' && content.trim()) {
      out.push({ role, content });
    }
  }
  return out.length > 0 ? out.slice(-MAX_HISTORY) : null;
}

/** Best-effort extraction of a readable message from a Groq error body. */
async function readUpstreamError(res: Response): Promise<string> {
  const text = await res.text().catch(() => '');
  try {
    const data = JSON.parse(text);
    const msg = data?.error?.message ?? data?.error ?? data?.message;
    if (typeof msg === 'string' && msg) return msg;
  } catch {
    /* not JSON */
  }
  return text.slice(0, 300);
}

export async function POST(request: Request) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return errorResponse(500, 'GROQ_API_KEY is not set.', 'Add it to .env.local and restart the dev server.');
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(400, 'Request body must be valid JSON.');
  }

  const messages = sanitizeMessages((body as { messages?: unknown } | null)?.messages);
  if (!messages) {
    return errorResponse(400, 'A non-empty "messages" array is required.');
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || DEFAULT_MODEL,
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
        temperature: 0.7,
        stream: true,
      }),
      // Pressing "Stop" in the UI aborts the client request, which cancels the Groq call too.
      signal: request.signal,
    });
  } catch (err) {
    if (request.signal.aborted) return new Response(null, { status: 499 });
    console.error('Groq request failed:', err);
    return errorResponse(502, 'Could not reach the model provider.', err instanceof Error ? err.message : undefined);
  }

  if (!upstream.ok || !upstream.body) {
    const details = await readUpstreamError(upstream);
    console.error('Groq API error:', upstream.status, details);
    const friendly =
      upstream.status === 401
        ? 'The Groq API key was rejected.'
        : upstream.status === 429
          ? 'Rate limit reached. Please wait a moment and try again.'
          : 'The model provider returned an error.';
    return errorResponse(upstream.status >= 400 && upstream.status < 600 ? upstream.status : 502, friendly, details);
  }

  // Groq streams Server-Sent Events; the client wants plain text, so unwrap
  // each `data: {...}` line and forward only the visible answer tokens
  // (reasoning models also emit `delta.reasoning`, which is intentionally dropped).
  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = '';

  const extract = (line: string): { text: string; done: boolean } => {
    const trimmed = line.trim();
    if (!trimmed.startsWith('data:')) return { text: '', done: false };
    const payload = trimmed.slice(5).trim();
    if (payload === '[DONE]') return { text: '', done: true };
    try {
      const token = JSON.parse(payload)?.choices?.[0]?.delta?.content;
      return { text: typeof token === 'string' ? token : '', done: false };
    } catch {
      return { text: '', done: false };
    }
  };

  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) {
            const tail = extract(buffer).text;
            if (tail) controller.enqueue(encoder.encode(tail));
            controller.close();
            return;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? ''; // keep the trailing partial line for the next chunk

          let out = '';
          let finished = false;
          for (const line of lines) {
            const r = extract(line);
            out += r.text;
            if (r.done) finished = true;
          }

          if (out) controller.enqueue(encoder.encode(out));
          if (finished) {
            controller.close();
            await reader.cancel().catch(() => {});
            return;
          }
          if (out) return; // hand control back so the chunk is flushed to the client
        }
      } catch (err) {
        if (request.signal.aborted) controller.close();
        else controller.error(err);
      }
    },
    cancel(reason) {
      return reader.cancel(reason);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
    },
  });
}
