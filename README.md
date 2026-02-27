# Cat Call — Prototype

Voice-based cat rescue game. Scan for cats, make your call (pspsps!), and build your sanctuary.

## Run Locally

```bash
npm install
npm run dev
```

Open http://localhost:5173 — allow microphone when prompted.

## Deploy to Vercel

1. Create a new repo on [github.com/new](https://github.com/new) named `catcall-app`
2. Push this project:

   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/catcall-app.git
   git push -u origin main
   ```

3. Go to [vercel.com/new](https://vercel.com/new), import the repo, and deploy (Vite is auto-detected)

---

*Based on React + Vite template.*

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
