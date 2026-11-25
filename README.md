# Transaction Demo Studio

A standalone mobile-first transaction simulation website with a home screen, Send Money screen, and Lipa na M-PESA screen. Pochi la Biashara is available from both Send Money and Lipa na M-PESA.

## Run locally

Open `index.html` in Chrome or another modern browser for a normal browser session. No dependencies or internet connection are needed.

For a local server, run `python -m http.server 8000` from this directory and visit `http://localhost:8000`.

To hide Chrome's browser controls, serve this page from `localhost` or HTTPS, install it using Chrome's **Install app** or **Add to Home screen** option, then launch it from the installed app icon. Opening `index.html` directly does not support standalone mode.

## Deploy

Upload `index.html`, `style.css`, `script.js`, `manifest.webmanifest`, and the `assets/` directory to any static hosting service (e.g. GitHub Pages, Netlify, or Vercel).

## Behavior

- Supports Send Money, Send Money to Pochi, Buy Goods, Paybill, and Lipa na M-PESA to Pochi. Each flow asks for the recipient or business name and displays it on the receipt and confirmation message.
- Generates a transaction preview with the current Africa/Nairobi time, a demo reference, and a simulated confirmation message.
- Supports sharing demo details, copying the demo reference, and downloading a text demo receipt.
- This is a simulation only: no money is moved, no payment is verified, and displayed balances are placeholders.
- Other visible shortcuts explain when an action is not supported in this demo.

## Notes

The design is visually inspired by the supplied screenshots but is not an official M-PESA application. Roboto is bundled locally for consistent typography and works offline; its SIL Open Font License is included at `assets/OFL.txt`. CSS icons and emoji can vary slightly across devices.
