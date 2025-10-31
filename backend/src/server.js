const { WebSocketServer } = require("ws");
const dotenv = require("dotenv");
const express = require("express");
const path = require("path");

dotenv.config();

const app = express();
const port = process.env.PORT || 8080;

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "odra.html"));
});

app.use(express.static(path.join(__dirname, "public")));

const server = app.listen(port, () => {
  console.log(`Servidor HTTP e WebSocket rodando na porta ${port}`);
});

const wss = new WebSocketServer({ noServer: true });

wss.on("connection", (ws) => {
  ws.on("error", console.error);

  ws.on("message", (data) => {
    wss.clients.forEach((client) => {
      if (client.readyState === ws.OPEN) {
        client.send(data.toString());
      }
    });
  });

  console.log("Cliente WebSocket conectado");
});

server.on("upgrade", (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit("connection", ws, request);
  });
});
