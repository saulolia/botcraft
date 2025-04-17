const mineflayer = require('mineflayer')
const express = require('express')
const http = require('http')
const { Server } = require('socket.io')

const app = express()
const server = http.createServer(app)
const io = new Server(server)

const port = process.env.PORT || 3000

let bot = null
let botStatus = 'desconectado'
let onlinePlayers = 0
let botStartTime = null
let eventLogs = []
let messagesSent = 0

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
    logs: eventLogs,
    messagesSent: messagesSent
  }
}

function startBot() {
  bot = mineflayer.createBot({
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
    setTimeout(() => startBot(), 5000)
  })

  bot.on('error', err => {
    const msg = `Erro: ${err.message}`
    console.log(msg)
    addLog(msg)
    botStatus = 'erro'
  })

  bot.on('chat', (username, message) => {
    if (username !== bot.username) {
      const log = `${username}: ${message}`
      addLog(log)
      io.emit('chatMessage', log)
    }
  })
}

startBot()

io.on('connection', socket => {
  socket.on('sendMessage', msg => {
    if (botStatus === 'online') {
      bot.chat(msg)
      messagesSent += 1
      addLog(`Você: ${msg}`)
    }
  })

  socket.on('reconnect', () => {
    if (botStatus === 'desconectado') {
      addLog('Reconectando o bot...')
      startBot()
    }
  })

  socket.on('shutdown', () => {
    if (botStatus === 'online') {
      bot.quit('Bot desligado via painel')
      const msg = 'Bot desligado.'
      console.log(msg)
      addLog(msg)
    }
  })
})

app.get('/', (req, res) => {
  const logsHtml = eventLogs.map(log => `<li>${log}</li>`).join('')
  res.send(/* igual ao seu HTML atual, que está ótimo! */ `
    <!-- SEU HTML INTEIRO AQUI, sem alterações necessárias -->
    <!-- ... (mantém como está) ... -->
  `)
})

server.listen(port, () => {
  console.log(`Servidor web rodando na porta ${port}`)
})
