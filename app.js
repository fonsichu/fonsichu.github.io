
const socket = io();

const messages = document.getElementById("messages");
const status = document.getElementById("status");
const form = document.getElementById("chatForm");
const input = document.getElementById("messageInput");
const platformSelect = document.getElementById("platform");

let currentFilter = "all";
const seen = new Set();

socket.on("connect", () => {
  status.textContent = "Conectado al servidor";
});

socket.on("chat-status", (data) => {
  status.textContent = data.message;
});

socket.on("chat-message", (msg) => {
  // Evita volver a mostrar el mismo ID de plataforma.
  const id = `${msg.platform}:${msg.id}`;

  if (seen.has(id)) return;
  seen.add(id);

  const row = document.createElement("div");
  row.className = "message";
  row.dataset.platform = msg.platform;

  const badge = document.createElement("span");
  badge.className = `platform ${msg.platform}`;
  badge.textContent = msg.platform.toUpperCase();

  const user = document.createElement("strong");
  user.className = "username";
  user.textContent = msg.user + ":";

  const text = document.createElement("span");
  text.textContent = msg.text;

  row.append(badge, user, text);
  messages.appendChild(row);

  while (messages.children.length > 300) {
    messages.firstElementChild.remove();
  }

  messages.scrollTop = messages.scrollHeight;
  applyFilter();
});

document.querySelectorAll("[data-filter]").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll("[data-filter]")
      .forEach(b => b.classList.remove("active"));

    button.classList.add("active");
    currentFilter = button.dataset.filter;
    applyFilter();
  });
});

function applyFilter() {
  document.querySelectorAll(".message").forEach(row => {
    row.hidden =
      currentFilter !== "all" &&
      row.dataset.platform !== currentFilter;
  });
}

form.addEventListener("submit", event => {
  event.preventDefault();

  const text = input.value.trim();
  if (!text) return;

  socket.emit("send-message", {
    platform: platformSelect.value,
    text
  });

  input.value = "";
});

socket.on("send-result", result => {
  status.textContent = result.message;
});
