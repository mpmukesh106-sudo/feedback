const form = document.getElementById("feedback-form");
const statusEl = document.getElementById("status");
const submitBtn = document.getElementById("submit-btn");
const messageEl = document.getElementById("message");
const countEl = document.getElementById("count");

messageEl.addEventListener("input", () => {
  countEl.textContent = messageEl.value.length;
});

function showStatus(text, type) {
  statusEl.textContent = text;
  statusEl.className = type || "";
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  showStatus("", "");

  const data = {
    name: form.name.value.trim(),
    email: form.email.value.trim(),
    category: form.category.value,
    rating: Number(form.rating.value),
    message: form.message.value.trim(),
  };

  // Client-side checks (server validates again)
  if (data.name.length < 2) return showStatus("Please enter your name.", "err");
  if (!data.rating) return showStatus("Please choose a star rating.", "err");
  if (data.message.length < 5) return showStatus("Please write a little more feedback.", "err");

  submitBtn.disabled = true;
  submitBtn.textContent = "Sending...";

  try {
    const res = await fetch(`${window.API_BASE}/api/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const body = await res.json().catch(() => ({}));

    if (res.ok) {
      showStatus(body.message || "Thank you for your feedback!", "ok");
      form.reset();
      countEl.textContent = "0";
    } else {
      showStatus((body.errors && body.errors.join(" ")) || body.error || "Something went wrong.", "err");
    }
  } catch (err) {
    showStatus("Could not reach the server. Is the backend running?", "err");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Send feedback";
  }
});
