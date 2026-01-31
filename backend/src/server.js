const { WebSocketServer } = require("ws");
const dotenv = require("dotenv");
const express = require("express");
const path = require("path");

dotenv.config();

const app = express();
const port = process.env.PORT || 8080;

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "chat.html"));
});

const server = app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});

const wss = new WebSocketServer({ noServer: true });

// 🔥 estado global do iframe
let iframeState = {
  active: false,
  videoId: null
};

wss.on("connection", (ws) => {
  console.log("🟢 Cliente conectado");

  // 🔁 envia o estado atual para quem acabou de entrar
  if (iframeState.active) {
    ws.send(JSON.stringify({
      type: "IFRAME_PLAY",
      videoId: iframeState.videoId
    }));
  }

  ws.on("message", (data) => {
    let msg;

    try {
      msg = JSON.parse(data.toString());
    } catch {
      return;
    }

    // 🎵 controle do iframe
    if (msg.type === "IFRAME_PLAY") {
      iframeState.active = true;
      iframeState.videoId = msg.videoId;
    }

    if (msg.type === "IFRAME_CONTROL" && msg.action === "close") {
      iframeState.active = false;
      iframeState.videoId = null;
    }

    // 📡 broadcast para todos
    wss.clients.forEach((client) => {
      if (client.readyState === ws.OPEN) {
        client.send(JSON.stringify(msg));
      }
    });
  });

  ws.on("close", () => {
    console.log("🔴 Cliente desconectado");
  });
});

server.on("upgrade", (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit("connection", ws, request);
  });
});
