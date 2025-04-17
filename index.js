const mineflayer = require('mineflayer')
const express = require('express')

const app = express()
const port = process.env.PORT || 3000

let botStatus = 'desconectado'
let onlinePlayers = 0
let botStartTime = null
let eventLogs = [] // Armazena os últimos eventos (logs)

// Função para formatar tempo online
function getUptime() {
  if (!botStartTime) return 'Desconectado'
  const diff = Math.floor((Date.now() - botStartTime) / 1000)
  const h = Math.floor(diff / 3600)
  const m = Math.floor((diff % 3600) / 60)
  const s = diff % 60
  return `${h}h ${m}m ${s}s`
}

// Função para adicionar logs no histórico
function addLog(message) {
  const timestamp = new Date().toLocaleTimeString()
  eventLogs.unshift(`[${timestamp}] ${message}`)
  if (eventLogs.length > 10) eventLogs.pop() // Limita a 10 linhas
}

// Criando o bot
const bot = mineflayer.createBot({
  host: 'mapatest97.aternos.me', // exemplo: 'seuservidor.aternos.me'
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

  setInterval(() => {
    bot.setControlState('jump', true)
    setTimeout(() => bot.setControlState('jump', false), 200)
    bot.look(Math.random() * 360, Math.random() * 360, true)

    const players = Object.keys(bot.players)
    onlinePlayers = players.length
  }, 10000)
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

// Página web com status e log
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
        <p>Status: <strong>${botStatus}</strong></p>
        <p>Jogadores online: <strong>${onlinePlayers}</strong></p>
        <p>Tempo online: <strong>${getUptime()}</strong></p>

        <h2>Logs Recentes</h2>
        <ul>${logsHtml}</ul>
      </body>
    </html>
  `)
})

app.listen(port, () => {
  console.log(`Servidor web rodando na porta ${port}`)
})
