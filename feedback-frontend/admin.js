const loginSection = document.getElementById("login");
const dashSection = document.getElementById("dashboard");
const statusEl = document.getElementById("status");
const keyInput = document.getElementById("key");
const listEl = document.getElementById("list");
const distEl = document.getElementById("dist");

let adminKey = "";

function setStatus(text) {
  statusEl.textContent = text;
  statusEl.className = text ? "err" : "";
}

async function api(path, options = {}) {
  const res = await fetch(`${window.API_BASE}${path}`, {
    ...options,
    headers: { "x-admin-key": adminKey, ...(options.headers || {}) },
  });
  if (res.status === 401) throw new Error("Invalid admin key.");
  if (!res.ok) throw new Error("Request failed.");
  return res.json();
}

// Escape text so feedback content can never inject HTML.
function esc(str) {
  const div = document.createElement("div");
  div.textContent = str == null ? "" : String(str);
  return div.innerHTML;
}

function renderStats(stats) {
  document.getElementById("total").textContent = stats.total;
  document.getElementById("average").textContent = Number(stats.average).toFixed(2);

  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  stats.distribution.forEach((d) => (counts[d.rating] = d.count));
  const max = Math.max(1, ...Object.values(counts));
  distEl.innerHTML = [5, 4, 3, 2, 1]
    .map(
      (r) => `<div class="dist-row"><span>${r}★</span>
        <div class="bar"><span style="width:${(counts[r] / max) * 100}%"></span></div>
        <span>${counts[r]}</span></div>`
    )
    .join("");
}

function renderList(items) {
  if (!items.length) {
    listEl.innerHTML = '<p class="subtitle">No feedback yet.</p>';
    return;
  }
  listEl.innerHTML = items
    .map(
      (f) => `<div class="entry" data-id="${f.id}">
        <div class="entry-head">
          <div>
            <strong>${esc(f.name)}</strong>
            <span class="tag">${esc(f.category)}</span>
            <span class="stars-static">${"★".repeat(f.rating)}${"☆".repeat(5 - f.rating)}</span>
          </div>
          <button class="danger" data-delete="${f.id}">Delete</button>
        </div>
        <div class="meta">${esc(f.created_at)} UTC${f.email ? " · " + esc(f.email) : ""}</div>
        <p>${esc(f.message)}</p>
      </div>`
    )
    .join("");
}

async function load() {
  const [stats, items] = await Promise.all([api("/api/stats"), api("/api/feedback?limit=200")]);
  renderStats(stats);
  renderList(items);
}

async function login() {
  adminKey = keyInput.value.trim();
  if (!adminKey) return setStatus("Please enter the admin key.");
  setStatus("");
  try {
    await load();
    loginSection.classList.add("hidden");
    dashSection.classList.remove("hidden");
  } catch (err) {
    adminKey = "";
    setStatus(err.message === "Failed to fetch" ? "Could not reach the server." : err.message);
  }
}

document.getElementById("login-btn").addEventListener("click", login);
keyInput.addEventListener("keydown", (e) => e.key === "Enter" && login());

document.getElementById("logout-btn").addEventListener("click", () => {
  adminKey = "";
  keyInput.value = "";
  dashSection.classList.add("hidden");
  loginSection.classList.remove("hidden");
});

listEl.addEventListener("click", async (e) => {
  const id = e.target.dataset && e.target.dataset.delete;
  if (!id || !confirm("Delete this feedback?")) return;
  try {
    await api(`/api/feedback/${id}`, { method: "DELETE" });
    await load();
  } catch (err) {
    alert(err.message);
  }
});
