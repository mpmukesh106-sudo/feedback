# Feedback Website – Frontend

Plain HTML, CSS and JavaScript. No build step.

## Files

- `index.html`, `script.js` – public feedback form (name, email, category, star rating, message)
- `admin.html`, `admin.js` – admin dashboard (stats, list, delete) protected by the backend's admin key
- `style.css` – shared styles
- `config.js` – **set `API_BASE` to your backend URL**

## Run locally

1. Start the backend (see the backend README), e.g. on http://localhost:3000.
2. Serve this folder with any static server, for example:

   ```bash
   npx serve -l 5500 .
   # or
   python3 -m http.server 5500
   ```

3. Open http://localhost:5500.

Make sure the backend's `ALLOWED_ORIGIN` matches the frontend URL (e.g. `http://localhost:5500`).

## Deploy

Upload the folder to any static host (Netlify, GitHub Pages, Vercel, etc.) after changing
`API_BASE` in `config.js` to your deployed backend URL.
