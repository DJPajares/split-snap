# Split Snap 📸

> Scan a receipt, share a link, split the bill — fairly and instantly.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, Tailwind CSS 4, HeroUI |
| Backend | Hono (Node.js) |
| Database | MongoDB + Mongoose 9 |
| AI / OCR | Google Gemini (free), OpenAI GPT-4o (paid), Tesseract.js (offline) |
| Real-time | Server-Sent Events (SSE) |
| Monorepo | Turborepo + pnpm workspaces |
| Language | TypeScript 5.9 |

## Project Structure

```
split-snap/
├── apps/
│   ├── web/              # Next.js 16 frontend
│   │   ├── app/          # App Router pages
│   │   ├── components/   # React components
│   │   ├── hooks/        # Custom hooks
│   │   └── lib/          # API client
│   └── api/              # Hono REST API
│       ├── src/
│       │   ├── routes/       # API route handlers
│       │   ├── models/       # Mongoose schemas
│       │   ├── services/     # Scanner, SSE manager
│       │   ├── middleware/   # Auth (JWT)
│       │   └── lib/          # Config, DB, utils
│       └── ...
├── packages/
│   └── shared/           # Shared types, constants, tax calc
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 22+ (LTS)
- pnpm 10+
- MongoDB (local or [Atlas free tier](https://www.mongodb.com/atlas))

### Setup

```bash
# Clone and install
git clone <repo-url>
cd split-snap
pnpm install

# Configure environment
cp .env.example .env
# Edit .env — see "Receipt Scanner" section below

# Start development
pnpm dev
```

This starts:
- **Frontend** at http://localhost:3000
- **API** at http://localhost:3001

### Build

```bash
pnpm build
```

## Receipt Scanner

The scanner supports **3 providers** with an auto-fallback chain. Set `RECEIPT_SCANNER_PROVIDER` in `.env` to choose:

| Provider | Cost | Accuracy | Setup |
|----------|------|----------|-------|
| `gemini` | **Free** (15 req/min) | Best | Get key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey) |
| `openai` | ~$0.01–0.03/scan | Best | Get key at [platform.openai.com/api-keys](https://platform.openai.com/api-keys) |
| `tesseract` | **Free, offline** | Good | No setup needed — works out of the box |
| Manual entry | Free | N/A | Always available in the UI |

**Default mode (`auto`)** tries in order: Gemini → OpenAI → Tesseract. If no API keys are set, Tesseract OCR is used automatically.

```env
# .env
RECEIPT_SCANNER_PROVIDER=auto       # or: gemini, openai, tesseract
GOOGLE_AI_API_KEY=AIza...           # for Gemini
OPENAI_API_KEY=sk-...               # for OpenAI (optional)
```

## Features

- **Receipt Scanning** — Upload a photo; AI or OCR extracts line items automatically
- **Manual Entry** — Add items by hand if you prefer
- **Shareable Sessions** — 6-character code + QR code for easy sharing
- **Real-time Updates** — Everyone sees changes instantly via SSE
- **Fair Splitting** — Tax and tip distributed proportionally per person
- **Item Splitting** — Multiple people can share a single item
- **No Account Required** — Participants just need a name to join
- **Responsive Design** — Works on mobile, tablet, and desktop
- **Dark Mode** — Enabled by default via HeroUI theme

## How It Works

1. **Scan** — Upload a receipt image or enter items manually
2. **Share** — Get a session link / QR code, send it to your group
3. **Claim** — Each person selects the items they ordered
4. **Settle** — Everyone sees their total with tax and tip included

## API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/api/receipts/scan` | Scan receipt image |
| `GET` | `/api/receipts/provider` | Get active scanner provider |
| `POST` | `/api/sessions` | Create a new session |
| `GET` | `/api/sessions/:code` | Get session details |
| `POST` | `/api/sessions/:code/join` | Join a session |
| `PATCH` | `/api/sessions/:code/items/:id/claim` | Claim/unclaim an item |
| `PATCH` | `/api/sessions/:code/settle` | Mark session as settled |
| `GET` | `/api/sessions/:code/events` | SSE real-time updates |
| `POST` | `/api/auth/register` | Register |
| `POST` | `/api/auth/login` | Login |
| `GET` | `/api/auth/me` | Current user |

## License

MIT
