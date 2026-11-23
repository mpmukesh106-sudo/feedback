# Feedback Website

- feedback-backend/  -> Node.js + Express + SQLite API (see its README)
- feedback-frontend/ -> HTML/CSS/JS pages (see its README)

Quick start:
1. cd feedback-backend && npm install && ADMIN_KEY=yoursecret ALLOWED_ORIGIN=http://localhost:5500 npm start
2. cd feedback-frontend && python3 -m http.server 5500
3. Open http://localhost:5500  (admin page: /admin.html)
