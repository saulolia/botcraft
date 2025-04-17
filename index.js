const mineflayer = require('mineflayer')
const express = require('express')

const app = express()
const port = process.env.PORT || 3000

let botStatus = 'desconectado'
let onlinePlayers = 0
let botStartTime = null

function getUptime() {
  if (!botStartTime) return 'Desconectado'
  const diff = Math.floor((Date.now() - botStartTime) / 1000)
  const h = Math.floor(diff / 3600)
  const m = Math.floor((diff % 3600) / 60)
  const s = diff % 60
  return `${h}h ${m}m ${s}s`
}

// Criação do bot
const bot = mineflayer.createBot({
  host: 'mapatest97.aternos.me', // IP do seu servidor
  port: 18180,                   // Porta do servidor
  username: 'bot_espectador',    // Nome do bot
  version: '1.21.4'              // Versão do Minecraft
})

bot.on('spawn', () => {
  console.log('Bot entrou no servidor!')
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
  console.log('Bot caiu, tentando reconectar...')
  botStatus = 'desconectado'
  onlinePlayers = 0
  botStartTime = null
  setTimeout(() => bot.connect(), 5000)
})

bot.on('error', err => {
  console.log('Erro:', err)
  botStatus = 'erro'
})

// Site simples com informações do bot
app.get('/', (req, res) => {
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
            padding-top: 50px;
          }
          h1 { font-size: 2em; margin-bottom: 20px; }
          p { font-size: 1.2em; margin: 10px 0; }
        </style>
      </head>
      <body>
        <h1>Bot Mineflayer</h1>
        <p>Status: <strong>${botStatus}</strong></p>
        <p>Jogadores online: <strong>${onlinePlayers}</strong></p>
        <p>Tempo online: <strong>${getUptime()}</strong></p>
      </body>
    </html>
  `)
})

app.listen(port, () => {
  console.log(`Servidor web rodando na porta ${port}`)
})
