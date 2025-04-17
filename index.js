const mineflayer = require('mineflayer')

// Criação do bot
const bot = mineflayer.createBot({
  host: 'mapatest97.aternos.me', // Coloque aqui o IP do seu servidor Aternos
  port: 18180,                     // Porta padrão
  username: 'bot_espectador',      // Nome que o bot usará no servidor
  version: '1.21.4'                // Define explicitamente a versão do Minecraft
})

// Ações quando o bot entrar no servidor
bot.on('spawn', () => {
  console.log('Bot entrou no servidor!')

  // Faz movimentos simples a cada 10 segundos pra evitar ser kickado
  setInterval(() => {
    const movimentos = ['forward', 'back', 'left', 'right', 'jump', 'sneak']
    const acao = movimentos[Math.floor(Math.random() * movimentos.length)]

    bot.setControlState(acao, true)
    setTimeout(() => bot.setControlState(acao, false), 1000)

    // Gira aleatoriamente pra parecer ativo
    bot.look(Math.random() * 2 * Math.PI, Math.random() * 2 * Math.PI)
  }, 10000)
})

// Se desconectar, tenta reconectar
bot.on('end', () => {
  console.log('Bot foi desconectado. Tentando reconectar...')
  setTimeout(() => {
    bot.connect()
  }, 5000)
})

// Mostra erros no console
bot.on('error', (err) => {
  console.log('Erro:', err)
})
