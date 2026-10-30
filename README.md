# Shoutout Images

Paste a workplace shoutout, get a ridiculous picture of it.

> "Shoutout to John for dressing up as a robot at our recent conference and doing funny dances."
> becomes a clay figurine of a robot doing the worm under disco lights.

Personal prototype. Runs on localhost only.

## How it works

1. **Concept step.** Claude Haiku 5.5 (or an OpenAI text model as fallback) turns the shoutout into one funny visual gag and writes an image prompt. The person is abstracted away: never named, never depicted. Abstract shoutouts ("for being so patient") get an invented visual metaphor.
2. **Image step.** `gpt-image-1` renders the prompt in one of three house styles: clay figurine, flat vector, or retro comic. Random by default, or pick one. No text is ever requested in the image.
3. **Save.** Every result lands in `generated/` as a PNG plus a JSON sidecar with the shoutout, concept, style, and the exact prompt sent. The home page shows a strip of recent results; click one for details.

If the image model refuses a prompt, the app silently asks for a tamer concept once, then shows an error.

## Setup

### 1. Install

```bash
npm install
cp .env.example .env
```

### 2. Get an OpenAI key (images)

1. Sign in at platform.openai.com and add a prepaid balance under Settings → Billing. Medium quality costs about $0.04 per image.
2. Verify the organisation: Settings → Organization → General → **Verify Organization**. `gpt-image-1` returns a 403 without this. It is an ID check that usually takes minutes.
3. Create a key under API Keys and put it in `.env` as `OPENAI_API_KEY`.

### 3. Get an Anthropic key (concepts, recommended)

1. Sign in at console.anthropic.com and add a small balance under Settings → Billing. Concept calls cost a fraction of a cent each.
2. Create a key under Settings → API Keys and put it in `.env` as `ANTHROPIC_API_KEY`.

Skip this step and the concept step falls back to OpenAI automatically.

### 4. Run

```bash
npm run dev
```

Open http://localhost:3000.

## Mock mode

With no keys in `.env`, or with `MOCK=1`, the app runs in **mock mode**: canned concepts and placeholder SVG images after a short delay, with a visible MOCK badge on the page and on every card. Use it to try the UI before spending anything. Mock results are saved to `generated/` like real ones, so delete that folder when you go live if you want a clean gallery.

## Configuration

All in `.env`. See `.env.example` for the full list.

| Variable | Default | Notes |
|---|---|---|
| `OPENAI_API_KEY` | | Required for real images. |
| `ANTHROPIC_API_KEY` | | Preferred for the concept step. |
| `CONCEPT_PROVIDER` | `anthropic` if its key is set, else `openai` | Force `anthropic` or `openai`. |
| `MOCK` | off | `1` forces placeholder images. |
| `IMAGE_SIZE` | `1024x1024` | Also `1536x1024`, `1024x1536`. |
| `IMAGE_QUALITY` | `medium` | `low` (~$0.01), `medium` (~$0.04), `high` (~$0.17). |
| `ANTHROPIC_MODEL` | `claude-haiku-5-5` | |
| `OPENAI_TEXT_MODEL` | `gpt-5-mini` | Used when the concept provider is OpenAI. |
| `OPENAI_IMAGE_MODEL` | `gpt-image-1` | |

## Project layout

```
src/
  lib/
    env.ts        reads .env, decides provider and mock mode
    prompt.ts     the concept system prompt and final image prompt builder
    concept.ts    concept step (Anthropic or OpenAI, structured output)
    image.ts      gpt-image-1 call, content-policy detection
    mock.ts       mock concept and placeholder SVG
    store.ts      generated/ folder read and write
    styles.ts     the three house styles
    types.ts      record type and sample shoutouts
    download.ts   client-side canvas composite for "Download with caption"
  server/
    shoutout.ts   TanStack Start server functions (createConcept, createImage, gallery)
  routes/
    index.tsx            generator page
    gallery/$id.tsx      read-only detail view
    api/images/$file.ts  serves files from generated/
  components/            ResultCard, GalleryStrip, StyleBadge, MockBadge
generated/               output, gitignored
```

Stack: TanStack Start, TanStack Router, TanStack Query, React 19, Tailwind v4, TypeScript end to end.

## Tweaking the humour

The whole personality lives in `src/lib/prompt.ts`. Edit the system prompt, then compare results across a few shoutouts via the gallery detail pages, which show the exact prompt that produced each image.
