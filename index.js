const express = require('express');
const mineflayer = require('mineflayer');
const { pathfinder } = require('mineflayer-pathfinder');
const MongoClient = require('mongodb').MongoClient;

const app = express();
const port = process.env.PORT || 3000;

let bot;
let db;

// Conexão com MongoDB (altere a URL para seu MongoDB Atlas ou local)
MongoClient.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(client => {
  db = client.db('minecraftBot');
  console.log('✅ Conectado ao MongoDB');
}).catch(err => console.error('Erro ao conectar ao MongoDB:', err));

// Criar o bot Minecraft
function createBot() {
  bot = mineflayer.createBot({
    host: 'IP_DO_SERVIDOR', // <-- troque para seu IP de servidor
    port: 25565,
    username: 'BotMinecraft',
    version: '1.21.4',
  });

  bot.loadPlugin(pathfinder);

  bot.on('spawn', () => {
    console.log('🤖 Bot conectado!');
    logStatus('online');
  });

  bot.on('chat', (username, message) => {
    if (username === bot.username) return;

    if (message === 'olá') {
      bot.chat(`Olá, ${username}!`);
    }

    logCommand(username, message);
  });

  bot.on('end', () => {
    console.log('⚠️ Bot desconectado.');
    logStatus('offline');
  });

  bot.on('error', (err) => {
    console.error('Erro no bot:', err);
    logStatus('error');
  });
}

// Log de status
function logStatus(status) {
  if (db) {
    db.collection('bot_status').insertOne({
      status,
      timestamp: new Date(),
    });
  }
}

// Log de comandos
function logCommand(username, message) {
  if (db) {
    db.collection('commands').insertOne({
      username,
      message,
      timestamp: new Date(),
    });
  }
}

// Express config
app.set('view engine', 'ejs');
app.use(express.static('public'));

app.get('/', async (req, res) => {
  try {
    const status = await db.collection('bot_status').find({}).sort({ timestamp: -1 }).limit(1).toArray();
    const commands = await db.collection('commands').find({}).sort({ timestamp: -1 }).limit(10).toArray();
    const playersOnline = bot?.players ? Object.keys(bot.players).length : 0;
    const uptime = status[0] ? (new Date() - new Date(status[0].timestamp)) / 1000 : 0;

    res.render('index', {
      status: status[0] || { status: 'offline', timestamp: new Date() },
      commands,
      playersOnline,
      botUptime: Math.floor(uptime),
    });
  } catch (err) {
    res.status(500).send('Erro ao buscar dados.');
  }
});

app.listen(port, () => {
  console.log(`🌐 Servidor web em http://localhost:${port}`);
  createBot();
});
