# Pocket Progress — PWA

A ready-to-commit Vite + React Progressive Web App using your exact `App.jsx`.
Works offline (via Service Worker) and is installable.

## 🚀 Quick start

```bash
npm install
npm run dev   # local dev
npm run build # production build
npm run preview
```

## 📦 Deploy to GitHub Pages

1. If deploying to `https://<user>.github.io/<repo>` (project pages), edit `vite.config.js` and set:
   ```js
   base: '/<repo>/'
   ```
2. Commit & push.
3. Run:
   ```bash
   npm run deploy
   ```

## 🧰 Notes
- Tailwind is pulled via CDN in `index.html` for simplicity. If you want a local Tailwind build, remove the CDN, use `src/index.css` with Tailwind directives, and run it via PostCSS.
- All data is stored in `localStorage`, so it works offline by default.
