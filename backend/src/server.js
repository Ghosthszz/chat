const { WebSocketServer } = require("ws");
const dotenv = require("dotenv");
const express = require("express");
const path = require("path");

dotenv.config();

// Configuração do servidor Express
const app = express();
const port = process.env.PORT || 8080;

// Rota para servir o arquivo odra.html na raiz
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "odra.html"));
});

// Serve arquivos estáticos da pasta public (se precisar de outros arquivos)
app.use(express.static(path.join(__dirname, "public")));

// Inicia o servidor HTTP (Express)
const server = app.listen(port, () => {
  console.log(`Servidor HTTP e WebSocket rodando na porta ${port}`);
});

// Configuração do servidor WebSocket
const wss = new WebSocketServer({ noServer: true });

// Definição de comportamento do WebSocket
wss.on("connection", (ws) => {
  ws.on("error", console.error);

  ws.on("message", (data) => {
    // Transmite a mensagem para todos os clientes conectados
    wss.clients.forEach((client) => {
      if (client.readyState === ws.OPEN) {
        client.send(data.toString());
      }
    });
  });

  console.log("Cliente WebSocket conectado");
});

// Conectar o WebSocket ao servidor HTTP do Express
server.on("upgrade", (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit("connection", ws, request);
  });
});
