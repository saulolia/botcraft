const mineflayer = require('mineflayer')

// Crie o bot para entrar no seu servidor Aternos
const bot = mineflayer.createBot({
  host: 'mapatest97.aternos.me',  // Coloque o IP do seu servidor Aternos
  port: 18180,                      // A porta padrão é 25565
  username: 'BatataBOT',       // Escolha um nome para o seu bot
  version: 1.21.4,                   // O bot vai usar a versão automática do Minecraft
})

// Evento quando o bot está conectado
bot.on('spawn', () => {
  console.log('Bot entrou no servidor!')
  setInterval(() => {
    // O bot vai girar e pular para evitar inatividade
    bot.setControlState('jump', true)
    bot.setControlState('jump', false)
    bot.look(Math.random() * 360, Math.random() * 360, true)
    console.log('Bot pulando e girando!')
  }, 10000) // O bot faz uma ação a cada 10 segundos
})

// Evento para lidar com desconexão
bot.on('end', () => {
  console.log('Bot desconectado, tentando reconectar...')
  setTimeout(() => {
    bot.connect()  // Tentativa de reconexão
  }, 5000)  // Tenta reconectar após 5 segundos
})

// Evento para lidar com erros (ex: desconexões inesperadas)
bot.on('error', (err) => {
  console.log('🚨 Erro no bot:', err)
  setTimeout(() => {
    bot.connect()  // Se der erro, tenta reconectar
  }, 5000)  // Tenta reconectar após 5 segundos
})
