# Cat Call

Voice-based cat rescue game with a built-in cat editor.

- **Game** — Scan for stray cats, make your best "pspsps" call matching pitch and volume targets, and rescue them to your sanctuary.
- **Cat Editor V3** — Create and customize cats with breeds (Domestic, Bengal, Tiger, Lion, Panther, Cheetah, Lynx, Cougar, Jaguar), elemental types (Fire, Ice, Lightning, Galaxy, Unicorn), expressions, poses, and fine-tuned proportions.

## Run Locally

```bash
npm install
npm run dev
```

Open http://localhost:5173 — allow microphone when prompted for the game.

## Deploy to Vercel

1. Push this repo to GitHub
2. Go to [vercel.com/new](https://vercel.com/new), import the repo, and deploy (Vite is auto-detected)

## Tech

React + Vite. Procedural SVG cat rendering. Web Audio API for real-time pitch/volume detection.
