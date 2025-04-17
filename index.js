const mineflayer = require('mineflayer')
const express = require('express')
const http = require('http')
const { Server } = require('socket.io')

const app = express()
const server = http.createServer(app)
const io = new Server(server)

const port = process.env.PORT || 3000

let botStatus = 'desconectado'
let onlinePlayers = 0
let botStartTime = null
let eventLogs = []

function getUptime() {
  if (!botStartTime) return 'Desconectado'
  const diff = Math.floor((Date.now() - botStartTime) / 1000)
  const h = Math.floor(diff / 3600)
  const m = Math.floor((diff % 3600) / 60)
  const s = diff % 60
  return `${h}h ${m}m ${s}s`
}

function addLog(message) {
  const timestamp = new Date().toLocaleTimeString()
  eventLogs.unshift(`[${timestamp}] ${message}`)
  if (eventLogs.length > 10) eventLogs.pop()
  io.emit('statusUpdate', getStatusData())
}

function getStatusData() {
  return {
    status: botStatus,
    players: onlinePlayers,
    uptime: getUptime(),
    logs: eventLogs
  }
}

// Criando o bot
const bot = mineflayer.createBot({
  host: 'mapatest97.aternos.me',
  port: 18180,
  username: 'JuninGameplay',
  version: '1.21.4'
})

bot.on('spawn', () => {
  const msg = 'Bot entrou no servidor!'
  console.log(msg)
  addLog(msg)
  botStatus = 'online'
  botStartTime = Date.now()

  const actions = ['forward', 'back', 'left', 'right', 'jump', 'sneak', 'look']

  function doRandomAction() {
    const action = actions[Math.floor(Math.random() * actions.length)]

    if (action === 'look') {
      const yaw = Math.random() * 2 * Math.PI
      const pitch = (Math.random() - 0.5) * Math.PI
      bot.look(yaw, pitch, true)
    } else {
      bot.setControlState(action, true)
      setTimeout(() => bot.setControlState(action, false), 500)
    }
  }

  setInterval(() => {
    const players = Object.keys(bot.players)
    onlinePlayers = players.length
    doRandomAction()
    io.emit('statusUpdate', getStatusData())
  }, 5000)
})

bot.on('end', () => {
  const msg = 'Bot caiu, tentando reconectar...'
  console.log(msg)
  addLog(msg)
  botStatus = 'desconectado'
  onlinePlayers = 0
  botStartTime = null
  setTimeout(() => bot.connect(), 5000)
})

bot.on('error', err => {
  const msg = `Erro: ${err.message}`
  console.log(msg)
  addLog(msg)
  botStatus = 'erro'
})

app.get('/', (req, res) => {
  const logsHtml = eventLogs.map(log => `<li>${log}</li>`).join('')
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
          p { font-size: 1.2em; margin: 5px 0; }
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

        <h2>Logs Recentes</h2>
        <ul id="logs">${logsHtml}</ul>

        <script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>
        <script>
          const socket = io()
          socket.on('statusUpdate', (data) => {
            document.querySelector('#status').innerText = data.status
            document.querySelector('#players').innerText = data.players
            document.querySelector('#uptime').innerText = data.uptime
            document.querySelector('#logs').innerHTML = data.logs.map(log => '<li>' + log + '</li>').join('')
          })
        </script>
      </body>
    </html>
  `)
})

io.on('connection', socket => {
  socket.on('sendMessage', msg => {
    if (bot && bot.player && botStatus === 'online') {
      try {
        bot.chat(msg)
        addLog(`Você: ${msg}`)
      } catch (err) {
        console.log('Erro ao enviar mensagem:', err)
        addLog('Erro ao enviar mensagem pro servidor')
      }
    } else {
      addLog('❌ Bot ainda não está pronto pra enviar mensagens.')
    }
  })
})

server.listen(port, () => {
  console.log(`Servidor web rodando na porta ${port}`)
})
