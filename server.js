
import "dotenv/config";
import express from "express";
import http from "http";
import { Server } from "socket.io";
import chinterface from "chinterface";

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

const twitch = chinterface.service("twitch");
const kick = chinterface.service("kick");

function publish(platform, data) {
  io.emit("chat-message", {
    id: String(data.id),
    platform,
    user: data.username || "Usuario",
    text: data.raw || data.body || "",
    timestamp: data.timestamp || Date.now()
  });
}

async function startTwitch() {
  await twitch.setConfig({
    clientId: process.env.TWITCH_CLIENT_ID,
    channel: "fonsichu",
    username: process.env.TWITCH_USERNAME,
    accessToken: process.env.TWITCH_ACCESS_TOKEN,
    reconnect: true,
    parseEmoticon: true,
    formatMessages: true
  });

  twitch.on("message", data => {
    publish("twitch", data);
  });

  twitch.on("error", error => {
    console.error("Error Twitch:", error);
  });

  await twitch.connect();
  console.log("Twitch conectado");
}

async function startKick() {
  await kick.setConfig({
    channel: "fonsichu",
    accessToken: process.env.KICK_ACCESS_TOKEN,
    reconnect: true,
    parseEmoticon: true,
    formatMessages: true
  });

  await kick.loadUser();

  kick.on("message", data => {
    publish("kick", data);
  });

  kick.on("error", error => {
    console.error("Error Kick:", error);
  });

  await kick.connect();
  console.log("Kick conectado");
}

io.on("connection", socket => {
  socket.emit("chat-status", {
    message: "Conectado al chat unificado"
  });

  socket.on("send-message", async ({ platform, text }) => {
    // No habilitar el envío público hasta integrar OAuth
    // y comprobar que el usuario está autorizado.
    socket.emit("send-result", {
      success: false,
      message: "El envío requiere iniciar sesión con Twitch o Kick."
    });
  });
});

app.get("/health", (req, res) => {
  res.json({ online: true });
});

const port = process.env.PORT || 3000;

server.listen(port, async () => {
  console.log(`Servidor iniciado en puerto ${port}`);

  try {
    await startTwitch();
  } catch (error) {
    console.error("No se pudo conectar Twitch:", error.message);
  }

  try {
    await startKick();
  } catch (error) {
    console.error("No se pudo conectar Kick:", error.message);
  }
});
