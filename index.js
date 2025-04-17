const mineflayer = require('mineflayer')
const pathfinder = require('mineflayer-pathfinder')
const { GoalNear } = require('mineflayer-pathfinder').goals

// Crie o bot para entrar no seu servidor
const bot = mineflayer.createBot({
  host: 'mapatest97.aternos.me', // IP do seu servidor
  port: 18180,                   // Porta do servidor
  username: 'bot_espectador',    // Nome do bot
  version: '1.21.4'              // Versão do Minecraft
})

// Configurações do Pathfinder
bot.loadPlugin(pathfinder)

const areaLimit = 50 // Limite de 50 blocos (quadrado de 100x100)

bot.on('spawn', () => {
  console.log('Bot entrou no servidor!')

  setInterval(() => {
    // Movimento aleatório dentro de um quadrado 100x100
    const x = Math.floor(Math.random() * areaLimit * 2) - areaLimit
    const z = Math.floor(Math.random() * areaLimit * 2) - areaLimit
    const y = bot.entity.position.y

    bot.pathfinder.setGoal(new GoalNear(x, y, z, 1)) // Objetivo de movimento
  }, 5000) // Atualiza a cada 5 segundos

  // Movimento e ação para parecer mais com um jogador real
  setInterval(() => {
    bot.setControlState('jump', true) // Pula
    setTimeout(() => bot.setControlState('jump', false), 200) // Para de pular depois de 200ms

    bot.look(Math.random() * 360, Math.random() * 360, true) // Olha em direção aleatória
  }, 10000) // A cada 10 segundos

  setInterval(() => {
    bot.setControlState('forward', true) // Anda para frente
    setTimeout(() => bot.setControlState('forward', false), 2000) // Anda por 2 segundos
  }, 15000) // A cada 15 segundos

  // Movimentação aleatória com comportamento mais natural
  setInterval(() => {
    bot.setControlState('sprint', true) // Começa a correr
    setTimeout(() => bot.setControlState('sprint', false), 5000) // Para de correr depois de 5 segundos
  }, 20000) // A cada 20 segundos
})

bot.on('end', () => {
  console.log('Bot caiu, tentando reconectar...')
  setTimeout(() => bot.connect(), 5000)
})

bot.on('error', err => {
  console.log('Erro:', err)
})
