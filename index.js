const mineflayer = require('mineflayer')

const bot = mineflayer.createBot({
  host: 'mapatest97.aternos.me', // IP do seu servidor
  port: 18180,                   // Porta do servidor
  username: 'bot_espectador',    // Nome do bot
  version: '1.21.4'              // Versão do Minecraft
})

const areaLimit = 50; // Limite de 50 blocos para um quadrado de 100x100

function randomMovement() {
  const x = Math.floor(Math.random() * areaLimit * 2) - areaLimit;
  const z = Math.floor(Math.random() * areaLimit * 2) - areaLimit;
  const y = bot.entity.position.y;

  bot.pathfinder.setGoal(new mineflayer.pathfinder.goals.GoalNear(x, y, z, 1))
}

bot.on('spawn', () => {
  console.log('Bot entrou no servidor!')

  // Configura o comportamento de movimento do bot
  setInterval(() => {
    randomMovement()
  }, 5000) // O bot se move a cada 5 segundos

  setInterval(() => {
    bot.setControlState('jump', true)
    setTimeout(() => bot.setControlState('jump', false), 200)
    bot.look(Math.random() * 360, Math.random() * 360, true)
  }, 10000) // O bot gira e pula para parecer mais um jogador

  bot.on('physicTick', () => {
    bot.setControlState('forward', true)
    setTimeout(() => bot.setControlState('forward', false), 2000) // O bot anda para frente por 2 segundos
  })
})

bot.on('end', () => {
  console.log('Bot caiu, tentando reconectar...')
  setTimeout(() => bot.connect(), 5000)
})

bot.on('error', err => {
  console.log('Erro:', err)
})

