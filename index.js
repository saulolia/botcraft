const mineflayer = require('mineflayer');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { createScreen } = require('mineflayer-screen'); // Para capturar a tela

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const port = process.env.PORT || 3000;

let botStatus = 'desconectado';
let onlinePlayers = 0;
let botStartTime = null;
let eventLogs = [];
let messagesSent = 0;
let randomMovementEnabled = true; // Controle de movimento aleatório
let screenCaptureInterval; // Para controlar o intervalo de captura de tela

function getUptime() {
  if (!botStartTime) return 'Desconectado';
  const diff = Math.floor((Date.now() - botStartTime) / 1000);
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  const s = diff % 60;
  return `${h}h ${m}m ${s}s`;
}

function addLog(message) {
  const timestamp = new Date().toLocaleTimeString();
  eventLogs.unshift(`[${timestamp}] ${message}`);
  if (eventLogs.length > 10) eventLogs.pop();
  io.emit('statusUpdate', getStatusData());
}

function getStatusData() {
  return {
    status: botStatus,
    players: onlinePlayers,
    uptime: getUptime(),
    logs: eventLogs,
    messagesSent: messagesSent
  };
}

const bot = mineflayer.createBot({
  host: 'mapatest97.aternos.me',
  port: 18180,
  username: 'JuninGameplay',
  version: '1.21.4'
});

// Inicializando o sistema de captura de tela
const screen = createScreen(bot);

bot.on('spawn', () => {
  const msg = 'Bot entrou no servidor!';
  console.log(msg);
  addLog(msg);
  botStatus = 'online';
  botStartTime = Date.now();

  const actions = ['forward', 'back', 'left', 'right', 'jump', 'sneak', 'look'];

  function doRandomAction() {
    if (!randomMovementEnabled) return; // Não faz nada se o movimento aleatório estiver desativado

    const action = actions[Math.floor(Math.random() * actions.length)];

    if (action === 'look') {
      const yaw = Math.random() * 2 * Math.PI;
      const pitch = (Math.random() - 0.5) * Math.PI;
      bot.look(yaw, pitch, true);
    } else {
      bot.setControlState(action, true);
      setTimeout(() => bot.setControlState(action, false), 500);
    }
  }

  setInterval(() => {
    const players = Object.keys(bot.players);
    onlinePlayers = players.length;
    doRandomAction();
    io.emit('statusUpdate', getStatusData());
  }, 5000);

  // Iniciando a captura de tela a cada 100ms (10 FPS)
  screenCaptureInterval = setInterval(() => {
    screen.capture().then((frame) => {
      // Envia a imagem capturada para o cliente
      io.emit('frame', frame);
    });
  }, 100);
});

bot.on('end', () => {
  const msg = 'Bot caiu, tentando reconectar...';
  console.log(msg);
  addLog(msg);
  botStatus = 'desconectado';
  onlinePlayers = 0;
  botStartTime = null;
  clearInterval(screenCaptureInterval); // Parar a captura quando o bot desconectar
  setTimeout(() => bot.connect(), 5000);
});

bot.on('error', (err) => {
  const msg = `Erro: ${err.message}`;
  console.log(msg);
  addLog(msg);
  botStatus = 'erro';
});

// Escuta mensagens do chat no Minecraft
bot.on('chat', (username, message) => {
  if (username !== bot.username) {
    const log = `${username}: ${message}`;
    addLog(log);
    io.emit('chatMessage', log);
  }
});

// Recebe mensagens do site e envia para o Minecraft
io.on('connection', (socket) => {
  socket.on('sendMessage', (msg) => {
    if (botStatus === 'online') {
      bot.chat(msg);
      messagesSent += 1;
      addLog(`Você: ${msg}`);
    }
  });

  // Reconectar o bot
  socket.on('reconnect', () => {
    if (botStatus === 'desconectado') {
      bot.connect();
      const msg = 'Reconectando o bot...';
      console.log(msg);
      addLog(msg);
    }
  });

  // Desligar o bot
  socket.on('shutdown', () => {
    if (botStatus === 'online') {
      bot.quit('Bot desligado via painel');
      const msg = 'Bot desligado.';
      console.log(msg);
      addLog(msg);
    }
  });

  // Alternar o movimento aleatório
  socket.on('toggleRandomMovement', () => {
    randomMovementEnabled = !randomMovementEnabled;
    const status = randomMovementEnabled ? 'ativado' : 'desativado';
    console.log(`Movimento aleatório ${status}`);
    socket.emit('randomMovementStatus', status);
  });
});

app.get('/', (req, res) => {
  const logsHtml = eventLogs.map((log) => `<li>${log}</li>`).join('');
  res.send(`
    <html>
      <head>
        <title>Status do Bot</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #111;
            color: #eee;
            text-align: center;
            padding-top: 40px;
          }
          h1 { font-size: 2em; margin-bottom: 10px; }
          p, input, button { font-size: 1.1em; margin: 5px 0; }
          input {
            padding: 5px;
            width: 250px;
            border-radius: 5px;
            border: none;
          }
          button {
            padding: 6px 12px;
            border-radius: 5px;
            background-color: #28a745;
            color: white;
            border: none;
            cursor: pointer;
            margin: 5px;
          }
          ul {
            text-align: left;
            width: 80%;
            max-width: 500px;
            margin: 20px auto;
            background: #222;
            padding: 15px;
            border-radius: 10px;
            list-style: none;
          }
          li {
            font-family: monospace;
            margin-bottom: 5px;
          }
        </style>
      </head>
      <body>
        <h1>Status do Bot Minecraft</h1>
        <p>Status: <strong id="status">${botStatus}</strong></p>
        <p>Jogadores online: <strong id="players">${onlinePlayers}</strong></p>
        <p>Tempo online: <strong id="uptime">${getUptime()}</strong></p>
        <p>Mensagens enviadas: <strong id="messagesSent">${messagesSent}</strong></p>

        <h2>Logs Recentes</h2>
        <ul id="logs">${logsHtml}</ul>

        <h2>Enviar mensagem pro chat do Minecraft</h2>
        <input id="msgInput" placeholder="Digite sua mensagem..." />
        <button onclick="sendMsg()">Enviar</button>

        <h2>Controles do Bot</h2>
        <button onclick="reconnectBot()">Reconectar Bot</button>
        <button onclick="shutdownBot()">Desligar Bot</button>

        <h2>Controle de Movimento Aleatório</h2>
        <button id="randomMovementButton">Ativar Movimento Aleatório</button>

        <h2>Fotos em Cadeia</h2>
        <img id="screen" src="" width="640" height="360" />

        <script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>
        <script>
          const socket = io()

          socket.on('statusUpdate', (data) => {
            document.querySelector('#status').innerText = data.status
            document.querySelector('#players').innerText = data.players
            document.querySelector('#uptime').innerText = data.uptime
            document.querySelector('#messagesSent').innerText = data.messagesSent
            document.querySelector('#logs').innerHTML = data.logs.map(log => '<li>' + log + '</li>').join('')
          })

          socket.on('chatMessage', (msg) => {
            const logs = document.querySelector('#logs')
            const li = document.createElement('li')
            li.innerText = msg
            logs.prepend(li)
            if (logs.children.length > 10) logs.removeChild(logs.lastChild)
          })

          socket.on('randomMovementStatus', (status) => {
            document.querySelector('#randomMovementButton').innerText = status === 'ativado' ? 'Desativar Movimento Aleatório' : 'Ativar Movimento Aleatório'
          })

          socket.on('frame', (frame) => {
            document.querySelector('#screen').src = 'data:image/png;base64,' + frame
          })

          function sendMsg() {
            const msg = document.querySelector('#msgInput').value
            socket.emit('sendMessage', msg)
            document.querySelector('#msgInput').value = ''
          }

          function reconnectBot() {
            socket.emit('reconnect')
          }

          function shutdownBot() {
            socket.emit('shutdown')
          }

          document.querySelector('#randomMovementButton').onclick = () => {
            socket.emit('toggleRandomMovement')
          }
        </script>
      </body>
    </html>
  `);
});

server.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
