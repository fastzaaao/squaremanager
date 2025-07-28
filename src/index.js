const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('./config/config');
const { verifyAndUploadEmojis } = require('./utils/emojisVerifier');
const { verificarExpiracoes } = require('./jobs/expiracao');
const { removerAplicacoesExpiradas } = require('./jobs/remocao');
const { excluirBackupsAntigos } = require('./jobs/backups');
const { avisarPreExpiracoes } = require('./jobs/avisos');
require('./jobs/expiracao');

const client = new Client({ 
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ] 
});

console.clear();

client.commands = new Collection();

const getAllFiles = (dirPath, arrayOfFiles = []) => {
  const files = fs.readdirSync(dirPath);
  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getAllFiles(fullPath, arrayOfFiles);
    } else if (file.endsWith('.js')) {
      arrayOfFiles.push(fullPath);
    }
  });
  return arrayOfFiles;
};

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = getAllFiles(commandsPath);

for (const file of commandFiles) {
  const command = require(file);
  const commandName = command.data?.name || command.name;
  client.commands.set(commandName, command);
}

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
  const event = require(path.join(eventsPath, file));
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }
}

setInterval(() => { verifyAndUploadEmojis(client); }, 30000);

client.once('ready', () => {
  global.client = client;
  const cron = require('node-cron');
  cron.schedule('*/2 * * * *', () => {
    verificarExpiracoes(client);
    avisarPreExpiracoes(client);
    removerAplicacoesExpiradas();
    excluirBackupsAntigos();
  });

  removerAplicacoesExpiradas();
  excluirBackupsAntigos();
  verificarExpiracoes(client);
  avisarPreExpiracoes(client);
});

process.on('unhandledRejection', (reason, promise) => {
  if (reason && (reason.code === 10062 || (reason.message && reason.message.includes('Unknown Interaction')))) {
    return;
  }
  console.error('Rejeição não tratada:', reason);
});

process.on('uncaughtException', (error) => {
  if (error && (error.code === 10062 || (error.message && error.message.includes('Unknown interaction')))) {
    return;
  }
  console.error('Exceção não capturada:', error);
});

client.login(config.token);