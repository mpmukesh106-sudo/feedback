const express = require("express");
const cors = require("cors");
const Database = require("better-sqlite3");
const path = require("path");

const PORT = process.env.PORT || 3000;
const ADMIN_KEY = process.env.ADMIN_KEY || "change-me";
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "*";
const DB_FILE = process.env.DB_FILE || path.join(__dirname, "feedback.db");

// ---------- Database ----------
const db = new Database(DB_FILE);
db.pragma("journal_mode = WAL");
db.exec(`
  CREATE TABLE IF NOT EXISTS feedback (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT    NOT NULL,
    email      TEXT,
    category   TEXT    NOT NULL,
    rating     INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    message    TEXT    NOT NULL,
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
  )
`);

const insertStmt = db.prepare(
  "INSERT INTO feedback (name, email, category, rating, message) VALUES (?, ?, ?, ?, ?)"
);
const listStmt = db.prepare("SELECT * FROM feedback ORDER BY id DESC LIMIT ? OFFSET ?");
const deleteStmt = db.prepare("DELETE FROM feedback WHERE id = ?");
const statsStmt = db.prepare(
  "SELECT COUNT(*) AS total, ROUND(AVG(rating), 2) AS average FROM feedback"
);
const distStmt = db.prepare(
  "SELECT rating, COUNT(*) AS count FROM feedback GROUP BY rating ORDER BY rating"
);

// ---------- App ----------
const app = express();
app.use(cors({ origin: ALLOWED_ORIGIN }));
app.use(express.json({ limit: "20kb" }));

const CATEGORIES = ["General", "Bug", "Feature Request", "Design", "Other"];

// Very small in-memory rate limiter: 5 submissions / 10 min / IP
const hits = new Map();
function rateLimit(req, res, next) {
  const now = Date.now();
  const windowMs = 10 * 60 * 1000;
  const list = (hits.get(req.ip) || []).filter((t) => now - t < windowMs);
  if (list.length >= 5) {
    return res.status(429).json({ error: "Too many submissions. Please try again later." });
  }
  list.push(now);
  hits.set(req.ip, list);
  next();
}

function requireAdmin(req, res, next) {
  if (req.get("x-admin-key") !== ADMIN_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

// Health check
app.get("/api/health", (req, res) => res.json({ status: "ok" }));

// Submit feedback (public)
app.post("/api/feedback", rateLimit, (req, res) => {
  const { name, email, category, rating, message } = req.body || {};
  const errors = [];

  const cleanName = String(name || "").trim();
  const cleanEmail = String(email || "").trim();
  const cleanMessage = String(message || "").trim();
  const cleanCategory = String(category || "General").trim();
  const cleanRating = Number(rating);

  if (cleanName.length < 2 || cleanName.length > 80) errors.push("Name must be 2-80 characters.");
  if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) errors.push("Email is not valid.");
  if (!CATEGORIES.includes(cleanCategory)) errors.push("Invalid category.");
  if (!Number.isInteger(cleanRating) || cleanRating < 1 || cleanRating > 5)
    errors.push("Rating must be between 1 and 5.");
  if (cleanMessage.length < 5 || cleanMessage.length > 2000)
    errors.push("Message must be 5-2000 characters.");

  if (errors.length) return res.status(400).json({ errors });

  const info = insertStmt.run(cleanName, cleanEmail || null, cleanCategory, cleanRating, cleanMessage);
  res.status(201).json({ id: info.lastInsertRowid, message: "Thank you for your feedback!" });
});

// List feedback (admin)
app.get("/api/feedback", requireAdmin, (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
  const offset = parseInt(req.query.offset, 10) || 0;
  res.json(listStmt.all(limit, offset));
});

// Stats (admin)
app.get("/api/stats", requireAdmin, (req, res) => {
  const { total, average } = statsStmt.get();
  res.json({ total, average: average || 0, distribution: distStmt.all() });
});

// Delete feedback (admin)
app.delete("/api/feedback/:id", requireAdmin, (req, res) => {
  const info = deleteStmt.run(Number(req.params.id));
  if (!info.changes) return res.status(404).json({ error: "Not found" });
  res.json({ deleted: true });
});

app.use((req, res) => res.status(404).json({ error: "Not found" }));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Feedback API running on port ${PORT}`);

  if (ADMIN_KEY === "change-me") {
    console.warn("WARNING: Set ADMIN_KEY before deploying.");
  }
});
  
