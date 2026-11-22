# Transaction Demo Studio

A standalone mobile-first transaction simulation website. It supports exactly four types: Send Money, Buy Goods (Till Number), Pay Bill, and Pochi la Biashara.

## Run locally

Open `index.html` in Chrome or another modern browser for a normal browser session. No dependencies or internet connection are needed.

For a local server, run `python -m http.server 8000` from this directory and visit `http://localhost:8000`.

To hide Chrome's browser controls, serve this page from `localhost` or HTTPS, install it using Chrome's **Install app** or **Add to Home screen** option, then launch it from the installed app icon. Opening `index.html` directly does not support standalone mode.

## Deploy

Upload `index.html`, `style.css`, `script.js`, `manifest.webmanifest`, and the `assets/` directory to any static hosting service (e.g. GitHub Pages, Netlify, or Vercel).

## Behavior

- Captures current time at the moment Generate is clicked and formats it in Africa/Nairobi time.
- Four transaction types only.
- Supports preview, sharing demo details, and downloading a text demo receipt.
- No real money is moved, no payments are verified, and all previews are marked DEMO.
- The sample reference number is intentionally prefixed `DEMO-`.

## Notes

The design is visually inspired by the supplied screenshots but is not an official M-PESA application. Roboto is bundled locally for consistent typography and works offline; its SIL Open Font License is included at `assets/OFL.txt`. CSS icons and emoji can vary slightly across devices.
