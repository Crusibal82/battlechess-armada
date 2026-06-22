const statusLine = document.querySelector("#statusLine");
const loginForm = document.querySelector("#loginForm");
const submitButton = loginForm.querySelector("button[type='submit']");

function saveAuth(payload) {
  localStorage.setItem("battlechess-auth", JSON.stringify(payload));
  sessionStorage.setItem("battlechess-auth", JSON.stringify(payload));
}

async function api(path, body) {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  let payload;
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`Unexpected server response (${response.status}).`);
  }
  if (!response.ok) throw new Error(payload.error || "Request failed.");
  return payload;
}

function formData(form) {
  return Object.fromEntries(new FormData(form).entries());
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  submitButton.disabled = true;
  statusLine.textContent = "Signing in...";
  try {
    const payload = await api("/api/auth/login", formData(loginForm));
    saveAuth(payload);
    statusLine.textContent = "Opening lobbies...";
    const params = new URLSearchParams({
      token: payload.token,
      username: payload.user?.username || "",
    });
    window.location.assign(`./multiplayer.html?${params.toString()}`);
  } catch (error) {
    statusLine.textContent = error.message;
    submitButton.disabled = false;
  }
});
