# Shoutout Images

Paste a workplace shoutout, get a ridiculous picture of it.

> "Shoutout to John for dressing up as a robot at our recent conference and doing funny dances."
> becomes a clay figurine of a robot doing the worm under disco lights.

Personal prototype. Runs locally, or on Render or Railway behind a password (see Deploying).

## How it works

1. **Concept step.** Claude Haiku 5.5 (or an OpenAI text model as fallback) turns the shoutout into one funny visual gag and writes an image prompt. The person is abstracted away: never named, never depicted. Abstract shoutouts ("for being so patient") get an invented visual metaphor.
2. **Image step.** OpenAI's `gpt-image-2.5-flare` renders the prompt in one of three cute house styles, clay figurine, flat vector sticker, or cute cartoon, always on a single flat solid-colour background. Random by default, or pick one. No text is ever requested in the image. Rendering runs as a background job that the page polls every two seconds, so a slow render never trips a hosting proxy's request timeout.
3. **Save.** Every result lands in `generated/` as a PNG plus a JSON sidecar with the shoutout, concept, style, and the exact prompt sent. The home page shows a strip of recent results; click one for details.

If the image model refuses a prompt, the app silently asks for a tamer concept once, then shows an error.

The UI is a plain black-and-white, high-contrast design with light and dark modes. The sun/moon button in the header toggles the mode; the choice is remembered in the browser and otherwise follows the OS setting.

## Setup

### 1. Install

```bash
npm install
cp .env.example .env
```

### 2. Get an OpenAI key (images)

1. Sign in at platform.openai.com and add a prepaid balance under Settings → Billing. A medium-quality square image costs a few cents.
2. Verify the organisation: Settings → Organization → General → **Verify Organization**. OpenAI's docs say GPT Image models may require this; without it the API returns a 403. It is an ID check that usually takes minutes, and access can take up to 15 minutes to arrive afterwards.

   `gpt-image-1` was shut down by OpenAI on 23 October 2026 and `gpt-image-1.5` and `gpt-image-1-mini` go on 1 December 2026. The default here is the recommended replacement, `gpt-image-2.5-flare`. Override with `OPENAI_IMAGE_MODEL` (for example `gpt-image-2.5-sunburst` for more precise edits).
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
| `IMAGE_QUALITY` | `medium` | `low`, `medium`, `high`; the 2.5 models also accept `xhigh`, `max`, `auto`. Higher costs more. |
| `ANTHROPIC_MODEL` | `claude-haiku-5-5` | |
| `OPENAI_TEXT_MODEL` | `gpt-5-mini` | Used when the concept provider is OpenAI. |
| `OPENAI_IMAGE_MODEL` | `gpt-image-2.5-flare` | Also `gpt-image-2.5-sunburst`, `gpt-image-2`. |
| `APP_PASSWORD` | off | When set, the whole site asks for this password via HTTP Basic auth. Any username. |
| `GENERATED_DIR` | `./generated` | Where images are saved. Point at a persistent volume in production. |
| `IMAGE_HOURLY_LIMIT` | `30` | Max real images per rolling hour across all users. Mock images don't count. |

## Deploying to Render (free)

`render.yaml` declares the service, so deployment is a Blueprint:

1. **Set an OpenAI spend limit first.** platform.openai.com → Settings → Limits.
2. Sign in at render.com with GitHub → New → **Blueprint** → pick `shoutout-images` → Apply. Render builds with `npm ci && npm run build` on Node 24 and starts with `npm start`.
3. When prompted for `OPENAI_API_KEY` and `ANTHROPIC_API_KEY`, paste them, or leave both blank to deploy in mock mode.
4. `APP_PASSWORD` is generated for you. Copy it from the service's Environment tab. Any username plus that password gets you in.
5. Open the service URL. The first request after 15 idle minutes takes up to a minute while the free instance wakes.

Free-tier caveat: no persistent disk, so the gallery resets whenever the service spins down or redeploys. For a permanent gallery, move to Railway with a volume (below) or swap `src/lib/store.ts` for object storage such as Cloudflare R2.

`/healthz` is exempt from the password gate so Render's health check passes.

## Deploying to Railway

The app builds to a plain Node server via the Nitro adapter (`npm run build`, then `npm start`), which is what Railway expects. Images need a persistent volume, and the public URL needs a password so strangers can't spend your OpenAI balance.

**Pricing note.** Railway's trial gives a one-time $5 credit for 30 days. After that the Free plan has about $1 of monthly credit, which is not enough to keep a service always on, and Hobby is $5 a month with $5 of usage included. Check railway.com/pricing before relying on the free tier.

1. **Set an OpenAI spend limit first.** platform.openai.com → Settings → Limits. A hard monthly cap is the real safety net.
2. **Create the project.** railway.com → New Project → Deploy from GitHub repo → pick `shoutout-images`. Railway detects Node, runs `npm run build`, and starts with `npm start`. Node 22 or newer is required (`engines` in package.json says so). Set `NODE_VERSION=24` so Railway's npm matches the lock file.
3. **Add a volume.** On the service → Volumes → Add Volume, mount path `/data`.
4. **Set variables.** Service → Variables:

   ```
   OPENAI_API_KEY=sk-...
   ANTHROPIC_API_KEY=sk-ant-...
   APP_PASSWORD=<a long random password>
   GENERATED_DIR=/data
   IMAGE_HOURLY_LIMIT=30
   ```

   `PORT` is injected by Railway and picked up automatically.
5. **Expose it.** Service → Settings → Networking → Generate Domain. Open the URL, enter any username and your `APP_PASSWORD` when the browser prompts.
6. **Redeploys** happen on every push to `main`.

Everything on the volume survives redeploys. Without a volume, images disappear on each deploy.

## Project layout

```
src/
  lib/
    env.ts        reads .env, decides provider, mock mode, and deployment settings
    prompt.ts     the concept system prompt and final image prompt builder
    concept.ts    concept step (Anthropic or OpenAI, structured output)
    image.ts      gpt-image-1 call, content-policy detection
    mock.ts       mock concept and placeholder SVG
    store.ts      generated/ folder read and write
    styles.ts     the three house styles
    types.ts      record type and sample shoutouts
    ratelimit.ts  hourly image budget
    jobs.ts       in-memory background image jobs the browser polls
    download.ts   client-side canvas composite for "Download with caption"
  start.ts        global request middleware (HTTP Basic auth password gate)
  server/
    shoutout.ts   TanStack Start server functions (createConcept, startImage, getImageJob, gallery)
  routes/
    index.tsx            generator page
    gallery/$id.tsx      read-only detail view
    api/images/$file.ts  serves files from generated/
    healthz.ts           unauthenticated liveness check
render.yaml              Render Blueprint (free web service)
  components/            SiteHeader, ResultCard, GalleryStrip, StyleBadge, MockBadge, ThemeToggle
  styles.css             Tailwind entry, Satoshi font, light/dark colour tokens
generated/               output, gitignored
```

Stack: TanStack Start, TanStack Router, TanStack Query, React 19, Tailwind v4, TypeScript end to end.

## Tweaking the colours and font

Light and dark palettes live in `src/styles.css` as CSS variables (`--page`, `--card`, `--ink`, `--primary`, `--accent`, and so on), exposed to Tailwind as `bg-page`, `text-ink`, `bg-primary`, etc. Everything is black on white in light mode and white on black in dark mode, with a light grey only for subtle panel fills. The type scale is set one step larger than Tailwind's default in the same file. Dark mode is the `dark` class on `<html>`, toggled by `src/components/ThemeToggle.tsx`. The typeface is Satoshi, loaded from Fontshare in `src/routes/__root.tsx` and set as `--font-sans` in `src/styles.css`.

## Tweaking the humour

The whole personality lives in `src/lib/prompt.ts` (what makes a good gag) and `src/lib/styles.ts` (how each house style looks). Edit the system prompt, then compare results across a few shoutouts via the gallery detail pages, which show the exact prompt that produced each image.
