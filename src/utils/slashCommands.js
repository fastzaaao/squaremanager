const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');
const config = require('../config/config');
const logger = require('./logger');
require('dotenv').config(); ;

function getAllCommandFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllCommandFiles(filePath));
    } else if (file.endsWith('.js')) {
      results.push(filePath);
    }
  });
  return results;
}

async function registrarSlashCommands() {
  const commands = [];
  const commandsPath = path.join(__dirname, '../commands');
  const commandFiles = getAllCommandFiles(commandsPath);

  for (const file of commandFiles) {
  const command = require(file);
  if (command.data) {
    if (typeof command.data.toJSON === 'function') {
      commands.push(command.data.toJSON());
    } else {
      commands.push({
        name: command.data.name,
        description: command.data.description,
        options: command.data.options || [],
      });
    }
  }
}

  const rest = new REST({ version: '10' }).setToken(config.token);

  try {
    await rest.put(
      Routes.applicationGuildCommands(config.clientId, config.guildId),
      { body: commands }
    );
    logger.success('Slash commands registrados com sucesso!');
  } catch (error) {
    logger.error('Erro ao registrar slash commands:', error);
  }
}

module.exports = registrarSlashCommands;