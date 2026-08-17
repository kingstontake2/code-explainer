# Explain This

Personal free-tier code explainer: paste a snippet, get a plain-English explanation plus complexity/readability notes. Powered by **Groq** (no local LLM).

## Stack assumptions

- Next.js App Router, single Node process (`next dev` / `next start`)
- Durable quotas live in `.data/quota.json` (survives restarts)
- **Not** safe for multi-instance / Vercel serverless without a shared quota store
- Do **not** enable Groq paid / Developer billing for this project — stay on the free tier

## Setup

```bash
cp .env.example .env.local
# Put your GROQ_API_KEY in .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment

| Variable | Default | Purpose |
|---|---|---|
| `GROQ_API_KEY` | (required) | Groq API key |
| `GROQ_MODEL` | `openai/gpt-oss-120b` | Chat model (replaces retired `llama-3.3-70b-versatile`) |
| `RATE_LIMIT_PER_MINUTE` | `5` | App minute budget |
| `RATE_LIMIT_PER_DAY` | `50` | App day budget |
| `MAX_IN_FLIGHT` | `1` | Concurrent explains |
| `MAX_CODE_CHARS` | `6000` | Max paste size |
| `MAX_ESTIMATED_INPUT_TOKENS` | `4000` | Reject oversized prompt+code (chars/4) |
| `GROQ_TIMEOUT_MS` | `30000` | Upstream abort |

## Quotas

- Counters are reserved **before** Groq is called
- Failed attempts still count toward the day budget (anti-hammer)
- In-flight is released in `finally`
- Reset manually: delete `.data/quota.json` (or edit counts)

## Verification (acceptance checklist)

Until these pass, do not trust the scaffold:

1. Explain a small JS snippet → Explanation + Complexity/Notes render *(needs `GROQ_API_KEY`)*
2. Beginner vs technical produces visibly different tone *(needs key)*
3. Copy puts explanation text on clipboard *(UI; needs a successful explain)*
4. Six rapid clicks → at most one in-flight; extras get rate/busy errors without N Groq calls *(needs key for full path; in-flight guard verified via forced `inFlight: 1` → `RATE_LIMITED`)*
5. Set `RATE_LIMIT_PER_DAY=2` (or force `dayCount` to the limit in `.data/quota.json`) → next call blocked with **no** Groq hit → `QUOTA_EXCEEDED`
6. Restart the server — day counter still enforced via `.data/quota.json`
7. Paste > `MAX_CODE_CHARS` → `PAYLOAD_TOO_LARGE`, no Groq / no quota bump
8. Missing/invalid API key → `CONFIG` / upstream error, UI does not crash

**Verified in this scaffold without a Groq key:** (1 skipped), validation `400`, `CONFIG` on missing key, `PAYLOAD_TOO_LARGE`, durable `.data/quota.json` increments, `QUOTA_EXCEEDED`, minute `RATE_LIMITED`, in-flight `RATE_LIMITED`. Complete items 1–3 after adding `.env.local` with `GROQ_API_KEY`.

## Scripts

```bash
npm run dev    # development
npm run build  # production build
npm run start  # production server (single process)
npm run lint
```
